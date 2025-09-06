"use client";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import VideoCard from "./VideoCard";
import { PostItem } from "./types";

const SAMPLE_POSTS: PostItem[] = [
  {
    id: "p1",
    user: {
      handle: "@lumina.ai",
      name: "Lumina",
      avatar: "https://i.pravatar.cc/100?img=1",
    },
    caption: "AI lights that sync with your mood ✨",
    music: "lofi • midnight drive",
    interactions: {
      like: 9800,
      love: 1800,
      haha: 400,
      sad: 150,
      angry: 150,
    },
    comments: 632,
    saves: 940,
    thumbnail: "./Download (2).jpg",
    tags: ["#ai", "#setup", "#aesthetic"],
    videoSrc: "http://localhost:8000/media/firstbucket/Download (2).mp4",
  },
  {
    id: "p2",
    user: {
      handle: "@chef.jun",
      name: "Chef Jun",
      avatar: "https://i.pravatar.cc/100?img=12",
    },
    caption: "10-min ramen hack that actually slaps 🍜",
    music: "city pop • summer night",
    interactions: {
      like: 7000,
      love: 1800,
      haha: 300,
      sad: 150,
      angry: 126,
    },
    comments: 421,
    saves: 1205,
    thumbnail: "./Download.jpg",
    tags: ["#ramen", "#hack", "#homecooking"],
    videoSrc: "http://localhost:8000/media/firstbucket/Download.mp4",
  },
  {
    id: "p3",
    user: {
      handle: "@move.studio",
      name: "Move Studio",
      avatar: "https://i.pravatar.cc/100?img=33",
    },
    caption: "5-min posture reset for desk goblins 🧘‍♀️",
    music: "ambient • sea breeze",
    interactions: {
      like: 15000,
      love: 30000,
      haha: 400,
      sad: 240,
      angry: 900,
    },
    comments: 1170,
    saves: 3802,
    thumbnail: "./Download (1).jpg",
    tags: ["#wellness", "#stretch", "#desk"],
    videoSrc: "http://localhost:8000/media/firstbucket/Download (1).mp4",
  },
  {
    id: "p4",
    user: {
      handle: "@urban.vibes",
      name: "Urban Vibes",
      avatar: "https://i.pravatar.cc/100?img=45",
    },
    caption: "City night timelapse with chill beats 🌃",
    music: "chillhop • late night",
    interactions: {
      like: 11000,
      love: 2600,
      haha: 400,
      sad: 234,
      angry: 400,
    },
    comments: 389,
    saves: 1287,
    thumbnail: "./test.jpg",
    tags: ["#city", "#timelapse", "#vibes"],
    videoSrc: "http://localhost:8000/media/firstbucket/test.mp4",
  },
  {
    id: "p5",
    user: {
      handle: "@bear.vibes",
      name: "Bear Vibes",
      avatar: "https://i.pravatar.cc/100?img=45",
    },
    caption: "City night timelapse with chill beats 🌃",
    music: "chillhop • late night",
    interactions: {
      like: 800,
      love: 150,
      haha: 3000,
      sad: 30,
      angry: 31,
    },
    comments: 333,
    saves: 1234,
    thumbnail: "./mov_bbb.jpg",
    tags: ["#example"],
    videoSrc: "http://localhost:8000/media/firstbucket/mov_bbb.mp4",
  },
];

export default function Feed() {
  const posts = useMemo<PostItem[]>(() => SAMPLE_POSTS, []);
  const [index, setIndex] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animMs = 320;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastSnapAtRef = useRef<number>(0);
  const [containerH, setContainerH] = useState<number>(0);
  const ignoreSwipeRef = useRef<boolean>(false);

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
      if (target < 0 || target > posts.length - 1) {
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
  }, [index, isAnimating, containerH, posts.length]);

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
      if (target < 0 || target > posts.length - 1) return;
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
  }, [index, isAnimating, containerH, posts.length]);

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
      if (target < 0 || target > posts.length - 1) {
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
  }, [index, isAnimating, containerH, posts.length]);

  useEffect(() => {
    setOffset(0);
  }, [index]);

  // With full list rendering, we no longer need prev/next indices

  return (
    <main className="flex-1">
      <div
        ref={containerRef}
        tabIndex={0}
        className="mx-auto w-full max-w-[700px] px-3 overflow-hidden overscroll-none [--feed-top:56px]"
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
            {posts.map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                style={{ height: containerH || "100%" }}
              >
                <VideoCard post={p} isActive={i === index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
