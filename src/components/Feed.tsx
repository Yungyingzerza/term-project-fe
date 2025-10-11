"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import { usePathname } from "next/navigation";
import VideoCard from "./VideoCard";
import { useFeed } from "@/hooks/useFeed";
import type { FeedAlgo } from "@/hooks/useFeed";
import type { PostItem, VideoWatchCompletePayload } from "@/interfaces";
import { recordPostView } from "@/lib/api/feed";

interface FeedProps {
  seedItems?: PostItem[];
  seedCursor?: string | null;
  seedHasMore?: boolean;
  autoFetch?: boolean;
  forcedAlgo?: FeedAlgo;
  organizationId?: string | null;
}

// How many items to preload relative to the active index
// Increase these to buffer more videos at the cost of bandwidth/memory.
// const PRELOAD_AHEAD = 1; // e.g., 2 preloads the next two videos
const PRELOAD_BEHIND = 0; // e.g., 1 also preloads the previous video
// How many seconds to warm buffer for each preloaded video (approximate)
const PRELOAD_SECONDS = 3;
const WATCH_EPSILON = 0.09;
const WATCH_MAX_SECONDS = 24 * 60 * 60;

type WindowWithCSS = Window & {
  CSS?: {
    supports?: (query: string) => boolean;
  };
};

// Data is now provided by useFeed hook; sample posts removed.

export default function Feed({
  seedItems = [],
  seedCursor = null,
  seedHasMore = true,
  autoFetch = true,
  forcedAlgo,
  organizationId = null,
}: FeedProps = {}) {
  const pathname = usePathname();
  const derivedAlgo = forcedAlgo
    ? forcedAlgo
    : pathname?.startsWith("/following")
    ? "following"
    : "for-you";
  const { items, loading, error, fetchNext, hasMore, setAlgo, algo, refetch } =
    useFeed({
      algo: derivedAlgo,
      limit: 8,
      enabled: autoFetch,
      seedItems,
      seedCursor,
      seedHasMore,
      organizationId,
    });

  const [index, setIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const slideElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [containerH, setContainerH] = useState<number>(0);
  const ignoreSwipeRef = useRef<boolean>(false);
  const [PRELOAD_AHEAD, setPRELOAD_AHEAD] = useState<number>(0);
  const prefetchIndexRef = useRef<number | null>(null);
  const scrollStopTimerRef = useRef<number | null>(null);
  const watchTotalsRef = useRef<Map<string, number>>(new Map());
  const lastSentWatchRef = useRef<Map<string, number>>(new Map());
  const activePostIdRef = useRef<string | null>(null);
  const hasScrolledToTopRef = useRef<boolean>(false);

  const handleWatchComplete = useCallback(
    ({ postId, watchTimeSeconds }: VideoWatchCompletePayload) => {
      if (!postId) return;
      const increment = Number.isFinite(watchTimeSeconds)
        ? Math.max(0, watchTimeSeconds)
        : 0;
      if (increment <= 0) return;

      const prevTotal = watchTotalsRef.current.get(postId) ?? 0;
      const nextTotal = Math.min(prevTotal + increment, WATCH_MAX_SECONDS);
      watchTotalsRef.current.set(postId, nextTotal);

      const lastSent = lastSentWatchRef.current.get(postId) ?? 0;
      if (nextTotal <= lastSent + WATCH_EPSILON) {
        return;
      }
      lastSentWatchRef.current.set(postId, nextTotal);

      const roundedSeconds = Math.round(nextTotal * 10) / 10;
      void recordPostView({ postId, watchTimeSeconds: roundedSeconds }).catch(
        (error: unknown) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Failed to record post view", { postId, error });
          }
        }
      );
    },
    []
  );

  const handleVideoEntered = useCallback((postId: string) => {
    if (!postId) return;
    const currentTotal = watchTotalsRef.current.get(postId) ?? 0;
    const roundedSeconds = Math.round(currentTotal * 10) / 10;
    watchTotalsRef.current.set(postId, currentTotal);
    lastSentWatchRef.current.set(
      postId,
      Math.max(lastSentWatchRef.current.get(postId) ?? 0, roundedSeconds)
    );

    void recordPostView({ postId, watchTimeSeconds: roundedSeconds }).catch(
      (error: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Failed to record post view on enter", {
            postId,
            error,
          });
        }
      }
    );
  }, []);

  // Keep hook algo in sync with route changes
  useEffect(() => {
    const nextAlgo = forcedAlgo
      ? forcedAlgo
      : pathname?.startsWith("/following")
      ? "following"
      : "for-you";
    if (nextAlgo !== algo) {
      setAlgo(nextAlgo);
    }
    setIndex(0);
    prefetchIndexRef.current = null;
    hasScrolledToTopRef.current = false;
    const el = containerRef.current;
    if (el) {
      el.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, forcedAlgo]);

  // Ensure scroll to top on initial mount and when items load
  useEffect(() => {
    if (items.length > 0 && !hasScrolledToTopRef.current) {
      const el = containerRef.current;
      if (el) {
        // Force scroll to top to ensure first video is visible
        requestAnimationFrame(() => {
          el.scrollTop = 0;
          hasScrolledToTopRef.current = true;
        });
      }
    }
  }, [items.length]);

  //estimate network speed
  useEffect(() => {
    const image = new Image();
    const imageUrl =
      "https://upload.wikimedia.org/wikipedia/commons/3/3a/Cat03.jpg"; // ~300KB file
    const startTime = new Date().getTime();

    image.onload = () => {
      const endTime = new Date().getTime();
      const duration = (endTime - startTime) / 1000; // seconds
      const fileSizeBytes = 300 * 1024; // 300 KB (approx)
      const bitsLoaded = fileSizeBytes * 8;
      const speedMbps = parseFloat(
        (bitsLoaded / duration / (1024 * 1024)).toFixed(2)
      );

      if (speedMbps < 2) {
        setPRELOAD_AHEAD(0);
      } else if (speedMbps >= 2 && speedMbps < 5) {
        setPRELOAD_AHEAD(1);
      } else {
        setPRELOAD_AHEAD(2);
      }
    };

    image.onerror = () => {
      setPRELOAD_AHEAD(0);
    };

    // Trigger download
    image.src = `${imageUrl}?cacheBust=${Math.random()}`;
  }, []);

  // Native scroll-snap: observe which slide is mostly visible to set active index
  useEffect(() => {
    const root = containerRef.current as Element | null;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        let next: number | null = null;
        for (const e of entries) {
          const el = e.target as HTMLElement;
          const idxStr = el.getAttribute("data-index");
          if (!idxStr) continue;
          const idx = parseInt(idxStr, 10);
          if (e.isIntersecting && e.intersectionRatio >= 0.55) {
            next = idx;
          }
        }
        if (next != null && next !== index) setIndex(next);
      },
      { root, threshold: [0.55] }
    );
    slideElsRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [index, items.length]);

  // Robust mobile viewport handling: prefer 100dvh when supported, otherwise
  // fall back to the real visible viewport height in pixels.
  useEffect(() => {
    const computeAppVh = () => {
      if (typeof window === "undefined") return "100vh";
      try {
        const win = window as WindowWithCSS;
        if (win.CSS?.supports?.("height: 100dvh")) {
          return "100dvh";
        }
      } catch {}
      const h = window.visualViewport?.height || window.innerHeight;
      return `${Math.max(0, Math.round(h))}px`;
    };

    const apply = () => {
      const el = containerRef.current;
      if (!el) return;
      el.style.setProperty("--app-vh", computeAppVh());
      // Also recalc container height so item sizing stays in sync
      setContainerH(el.getBoundingClientRect().height || 0);
    };

    apply();
    const onResize = () => apply();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    // visualViewport fires more accurate resize events on mobile browsers
    const vv = window.visualViewport;
    vv?.addEventListener("resize", onResize);
    vv?.addEventListener("scroll", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      vv?.removeEventListener("resize", onResize as EventListener);
      vv?.removeEventListener("scroll", onResize as EventListener);
    };
  }, []);

  // Recalculate container height when bottom tabs height changes
  useEffect(() => {
    const recalc = () => {
      const el = containerRef.current;
      if (!el) return;
      setContainerH(el.getBoundingClientRect().height || 0);
    };
    window.addEventListener(
      "bottom-tabs-height-change",
      recalc as EventListener
    );
    return () =>
      window.removeEventListener(
        "bottom-tabs-height-change",
        recalc as EventListener
      );
  }, []);

  const isInteractiveTarget = (target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    // Ignore feed swipe gestures that start on obviously interactive UI
    // including ActionRail controls and their picker.
    return !!el.closest(
      [
        "button",
        "a",
        "input",
        "select",
        "textarea",
        '[role="button"]',
        '[role="radio"]',
        '[role="radiogroup"]',
        "[data-reaction]",
        "[data-prevent-feed-swipe]",
        '[aria-label="React"]',
        '[aria-label="Reactions"]',
      ].join(",")
    );
  };

  useLayoutEffect(() => {
    const update = () =>
      setContainerH(containerRef.current?.getBoundingClientRect().height || 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Bottom tabs height is provided globally by BottomTabs via --bottom-tabs-h

  // Native scroll: set dragging on scroll, clear shortly after it settles
  useEffect(() => {
    const el = containerRef.current as HTMLElement | null;
    if (!el) return;
    const onScroll = () => {
      if (!isDragging) setIsDragging(true);
      if (scrollStopTimerRef.current != null) {
        window.clearTimeout(scrollStopTimerRef.current);
      }
      scrollStopTimerRef.current = window.setTimeout(() => {
        setIsDragging(false);
        scrollStopTimerRef.current = null;
      }, 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll as EventListener);
      if (scrollStopTimerRef.current != null) {
        window.clearTimeout(scrollStopTimerRef.current);
        scrollStopTimerRef.current = null;
      }
    };
  }, [isDragging]);

  // Keyboard snapping removed for native scroll mode

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      ignoreSwipeRef.current = isInteractiveTarget(e.target);
      if (ignoreSwipeRef.current) return;
      setIsDragging(true);
    };
    const onTouchEnd = () => setIsDragging(false);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart as EventListener);
      window.removeEventListener("touchend", onTouchEnd as EventListener);
    };
  }, []);

  // no-op: index changes are handled by native scroll

  // With full list rendering, we no longer need prev/next indices

  // Prefetch next page when approaching the end
  useEffect(() => {
    if (!hasMore) return;
    // When within 1 from the end (accounting for preload), fetch next page.
    // Guard to only trigger once per index value to avoid spamming.
    const nearEnd =
      items.length > 0 && index >= items.length - 1 - PRELOAD_AHEAD;
    if (nearEnd && prefetchIndexRef.current !== index) {
      prefetchIndexRef.current = index;
      void fetchNext();
    }
    if (!nearEnd) {
      // Reset guard when moving away from the end
      prefetchIndexRef.current = null;
    }
  }, [index, items.length, PRELOAD_AHEAD, hasMore, fetchNext]);

  // Ensure index stays within bounds if items shrink (e.g., refetch/reset)
  useEffect(() => {
    if (index > 0 && index > items.length - 1) {
      setIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, index]);

  useEffect(() => {
    const activePost = items[index];
    const activeId = activePost?.id ?? null;
    if (!activeId) {
      activePostIdRef.current = null;
      return;
    }
    if (activePostIdRef.current === activeId) return;
    activePostIdRef.current = activeId;
    handleVideoEntered(activeId);
  }, [handleVideoEntered, index, items]);

  return (
    <main
      ref={containerRef}
      tabIndex={0}
      className="flex-1 overflow-y-auto no-scrollbar overscroll-none [scroll-snap-type:y_mandatory] [--feed-top:0px] md:[--feed-top:56px]"
      style={{
        height:
          "calc(var(--app-vh, 100dvh) - var(--feed-top, 56px) - var(--bottom-tabs-h, 0px))",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="mx-auto w-full max-w-[700px] sm:px-3 md:px-3">
        {items.map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            style={{
              height: containerH || "100%",
              // Reduce paint costs for offscreen slides
              contain: "layout paint size style",
              contentVisibility: "auto",
            }}
            className="[scroll-snap-align:start] [scroll-snap-stop:always]"
            data-index={i}
            ref={(el) => {
              slideElsRef.current[i] = el;
            }}
          >
            {(() => {
              const preloadNext = i > index && i <= index + PRELOAD_AHEAD;
              const preloadPrev = i < index && i >= index - PRELOAD_BEHIND;
              const shouldPreload = preloadNext || preloadPrev;
              // Only render nearby cards to cut DOM/paint cost
              const inRenderWindow =
                i >= index - 1 - PRELOAD_BEHIND &&
                i <= index + 1 + PRELOAD_AHEAD;
              return inRenderWindow ? (
                <VideoCard
                  post={p}
                  isActive={i === index}
                  shouldPreload={shouldPreload}
                  preloadSeconds={PRELOAD_SECONDS}
                  onWatchComplete={handleWatchComplete}
                />
              ) : null;
            })()}
          </div>
        ))}
        {items.length === 0 && (
          <div
            className="flex items-center justify-center w-full"
            style={{ height: containerH || "100%" }}
          >
            <div className="text-center text-white/70">
              {error ? (
                <div className="space-y-2">
                  <p>Failed to load feed.</p>
                  <button
                    className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold hover:opacity-90"
                    onClick={() => refetch()}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <p>{loading ? "กำลังโหลด…" : "ยังไม่มีโพสต์"}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
