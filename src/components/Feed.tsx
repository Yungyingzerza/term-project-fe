"use client";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import VideoCard from "./VideoCard";
import { useFeed } from "@/hooks/useFeed";

// How many items to preload relative to the active index
// Increase these to buffer more videos at the cost of bandwidth/memory.
// const PRELOAD_AHEAD = 1; // e.g., 2 preloads the next two videos
const PRELOAD_BEHIND = 0; // e.g., 1 also preloads the previous video
// How many seconds to warm buffer for each preloaded video (approximate)
const PRELOAD_SECONDS = 3;

// Data is now provided by useFeed hook; sample posts removed.

export default function Feed() {
  const pathname = usePathname();
  const initialAlgo = pathname?.startsWith("/following")
    ? "following"
    : "for-you";
  const { items, loading, error, fetchNext, hasMore, setAlgo, algo, refetch } =
    useFeed({ algo: initialAlgo, limit: 8 });

  const [index, setIndex] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animMs = 320;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastSnapAtRef = useRef<number>(0);
  const [containerH, setContainerH] = useState<number>(0);
  const ignoreSwipeRef = useRef<boolean>(false);
  const [PRELOAD_AHEAD, setPRELOAD_AHEAD] = useState<number>(0);
  const prefetchIndexRef = useRef<number | null>(null);

  // Keep hook algo in sync with route changes
  useEffect(() => {
    const nextAlgo = pathname?.startsWith("/following")
      ? "following"
      : "for-you";
    if (nextAlgo !== algo) {
      setAlgo(nextAlgo);
      setIndex(0);
      setOffset(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

  // Robust mobile viewport handling: prefer 100dvh when supported, otherwise
  // fall back to the real visible viewport height in pixels.
  useEffect(() => {
    const computeAppVh = () => {
      if (typeof window === "undefined") return "100vh";
      try {
        if ((window as any).CSS?.supports?.("height: 100dvh")) {
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

  const getThreshold = () => {
    const h = containerRef.current?.getBoundingClientRect().height || 600;
    return Math.max(80, Math.min(240, Math.round(h * 0.25)));
  };

  useEffect(() => {
    const animateSnap = (dir: number) => {
      const target = index + dir;
      if (target < 0 || target > items.length - 1) {
        // bounce back at edges
        setOffset(0);
        return;
      }
      setIsAnimating(true);
      setOffset(
        dir *
          (containerH ||
            containerRef.current?.getBoundingClientRect().height ||
            0)
      );
      window.setTimeout(() => {
        setIndex(target);
        setOffset(0);
        setIsAnimating(false);
      }, animMs);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimating) return;

      // Cooldown to prevent double-skip on high-res touchpads
      const now = performance.now();
      const cooldownMs = 600; // extend cooldown to avoid double-skip on long gestures
      if (now - lastSnapAtRef.current < cooldownMs) return;

      // Normalize delta to pixels and require a minimal per-event threshold
      const unit =
        e.deltaMode === 1
          ? 16
          : e.deltaMode === 2
          ? containerH ||
            containerRef.current?.getBoundingClientRect().height ||
            1
          : 1;
      const deltaPx = e.deltaY * unit;

      const minEventPx = 28; // require deliberate motion on touchpads
      if (Math.abs(deltaPx) < minEventPx) return;

      const dir = deltaPx > 0 ? 1 : -1;
      animateSnap(dir);
      lastSnapAtRef.current = now;
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () =>
      window.removeEventListener("wheel", handleWheel as EventListener);
  }, [index, isAnimating, containerH, items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl &&
        (targetEl.isContentEditable ||
          ["input", "textarea", "select"].includes(
            targetEl.tagName.toLowerCase()
          ))
      ) {
        return;
      }
      if (isAnimating) return;
      const down = e.key === "ArrowDown" || e.key === "PageDown";
      const up = e.key === "ArrowUp" || e.key === "PageUp";
      if (!down && !up) return;
      e.preventDefault();
      const dir = down ? 1 : -1;
      const target = index + dir;
      if (target < 0 || target > items.length - 1) return;
      setIsAnimating(true);
      setOffset(
        dir *
          (containerH ||
            containerRef.current?.getBoundingClientRect().height ||
            0)
      );
      window.setTimeout(() => {
        setIndex(target);
        setOffset(0);
        setIsAnimating(false);
      }, animMs);
    };
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () =>
      window.removeEventListener("keydown", handleKeyDown as EventListener);
  }, [index, isAnimating, containerH, items.length]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      ignoreSwipeRef.current = isInteractiveTarget(e.target);
      if (ignoreSwipeRef.current) return;
      touchStartY.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (ignoreSwipeRef.current) return;
      if (touchStartY.current == null) return;
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? touchStartY.current;
      const dy = touchStartY.current - y;
      const factor = 0.7;
      let nextOffset = dy * factor;
      setOffset(nextOffset);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (ignoreSwipeRef.current) {
        // Reset and ignore this gesture for feed navigation
        ignoreSwipeRef.current = false;
        touchStartY.current = null;
        return;
      }
      if (touchStartY.current == null) return;
      const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
      const dy = touchStartY.current - endY;
      touchStartY.current = null;
      if (isAnimating) return;
      const th = getThreshold();
      const dir = dy > th ? 1 : dy < -th ? -1 : 0;
      if (dir === 0) {
        setOffset(0);
        return;
      }
      const target = index + dir;
      if (target < 0 || target > items.length - 1) {
        setOffset(0);
        return;
      }
      setIsAnimating(true);
      setOffset(
        dir *
          (containerH ||
            containerRef.current?.getBoundingClientRect().height ||
            0)
      );
      window.setTimeout(() => {
        setIndex(target);
        setOffset(0);
        setIsAnimating(false);
      }, animMs);
    };
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      window.removeEventListener("touchstart", onTouchStart as EventListener);
      window.removeEventListener("touchmove", onTouchMove as EventListener);
      window.removeEventListener("touchend", onTouchEnd as EventListener);
    };
  }, [index, isAnimating, containerH, items.length]);

  useEffect(() => {
    setOffset(0);
  }, [index]);

  // With full list rendering, we no longer need prev/next indices

  // Prefetch next page when approaching the end
  useEffect(() => {
    if (!hasMore) return;
    // When within 1 from the end (accounting for preload), fetch next page.
    // Guard to only trigger once per index value to avoid spamming.
    const nearEnd = items.length > 0 && index >= items.length - 1 - PRELOAD_AHEAD;
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

  return (
    <main className="flex-1">
      <div
        ref={containerRef}
        tabIndex={0}
        className="mx-auto w-full max-w-[700px] sm:px-3 overflow-hidden overscroll-none [--feed-top:56px]"
        style={{
          // Visible viewport minus fixed top bar and bottom tabs/safe-area.
          height:
            "calc(var(--app-vh, 100dvh) - var(--feed-top, 56px) - var(--bottom-tabs-h, 0px))",
        }}
      >
        <div className="relative w-full h-full overflow-hidden">
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              transform:
                containerH > 0
                  ? `translateY(-${index * containerH + offset}px)`
                  : `translateY(0)`,
              transition: isAnimating ? `transform ${animMs}ms ease` : "none",
            }}
          >
            {items.map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                style={{ height: containerH || "100%" }}
              >
                {(() => {
                  const preloadNext = i > index && i <= index + PRELOAD_AHEAD;
                  const preloadPrev = i < index && i >= index - PRELOAD_BEHIND;
                  const shouldPreload = preloadNext || preloadPrev;
                  return (
                    <VideoCard
                      post={p}
                      isActive={i === index}
                      shouldPreload={shouldPreload}
                      preloadSeconds={PRELOAD_SECONDS}
                    />
                  );
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
                    <p>{loading ? "Loading…" : "No posts yet."}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
