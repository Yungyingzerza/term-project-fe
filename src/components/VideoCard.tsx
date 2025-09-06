"use client";
import { MoreVertical, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleMuted, setAmbientColor } from "@/store/playerSlice";
import ActionRail from "./ActionRail";
import MusicTicker from "./MusicTicker";
import { VideoCardProps } from "./types";

export default function VideoCard({
  post,
  isActive = false,
  shouldPreload = false,
  preloadSeconds = 5,
}: VideoCardProps) {
  const dispatch = useDispatch();
  const muted = (useSelector((s: any) => s.player.muted) &&
    isActive) as boolean;
  const [playing, setPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const prevActiveRef = useRef<boolean>(isActive);
  const samplerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSentColorRef = useRef<string | null>(null);
  const [usePosterBg, setUsePosterBg] = useState<boolean>(false);
  // Only load the active card's video, but allow light preload for next card
  const shouldLoad = isActive || shouldPreload;
  const preloadDoneRef = useRef<boolean>(false);
  const isActiveRef = useRef<boolean>(isActive);

  // Track latest isActive in a ref to avoid stale closures in event handlers
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Reset preload state when the source changes
  useEffect(() => {
    preloadDoneRef.current = false;
  }, [post.videoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    // Background video stays muted regardless
    const bg = bgVideoRef.current;
    if (bg) bg.muted = true;
  }, [muted]);

  // When becoming active, ensure playhead starts from 0 even if preloading advanced it
  useEffect(() => {
    if (!isActive) return;
    const v = videoRef.current;
    if (!v) return;
    try {
      if (isFinite(v.currentTime) && v.currentTime > 0.05) {
        v.currentTime = 0;
      }
    } catch {}
  }, [isActive, post.videoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    const bg = bgVideoRef.current;
    if (!v) return;
    const shouldPlay = isActive && playing;
    if (shouldPlay) {
      const playPromise = v.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
      if (bg) {
        const p2 = bg.play();
        if (p2 && typeof p2.catch === "function") p2.catch(() => {});
      }
    } else {
      v.pause();
      if (bg) bg.pause();
    }
  }, [playing, isActive]);

  // Ensure mute state matches global when becoming active (may override preload's temp mute)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      try {
        v.muted = muted;
      } catch {}
    }
  }, [isActive, muted]);

  // Link background <video> to the primary video stream to avoid double network load.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // If we are not loading, or only preloading, keep poster bg and clear stream
    if (!shouldLoad || !isActive) {
      setUsePosterBg(true);
      try {
        const b = bgVideoRef.current as any;
        if (b) {
          b.srcObject = null;
          // Also clear src if we set it in fallback mode
          try {
            b.removeAttribute("src");
            b.load();
          } catch {}
        }
      } catch {}
      return;
    }

    // Ensure the bg <video> element exists when we need it
    // Do not flip state here to avoid render loops on iOS where captureStream is unsupported
    if (!bgVideoRef.current) {
      return;
    }

    let active = true;
    const link = () => {
      if (!active) return;
      const bg = bgVideoRef.current as any;
      if (!bg) return;
      try {
        const stream: MediaStream | undefined =
          (v as any).captureStream?.() || (v as any).mozCaptureStream?.();
        if (stream) {
          try {
            bg.srcObject = stream;
            // Ensure we are showing the bg video layer
            setUsePosterBg(false);
          } catch {}
        } else {
          // iOS Safari: captureStream unsupported. Fallback to using the same src.
          try {
            const src = (v.currentSrc || v.src || (post as any).videoSrc) as string | undefined;
            if (src) {
              if (bg.src !== src) bg.src = src;
              // Try to keep it in sync; separate effect adjusts currentTime
              const p = bg.play?.();
              if (p && typeof p.catch === "function") p.catch(() => {});
              setUsePosterBg(false);
            } else {
              setUsePosterBg(true);
            }
          } catch {
            setUsePosterBg(true);
          }
        }
      } catch {
        // If anything fails, show blurred poster fallback
        setUsePosterBg(true);
      }
    };
    if (v.readyState >= 1) link();
    else v.addEventListener("loadedmetadata", link);
    return () => {
      active = false;
      v.removeEventListener("loadedmetadata", link as EventListener);
      const b = bgVideoRef.current as any;
      if (b) {
        try {
          b.srcObject = null;
          b.removeAttribute("src");
          b.load();
        } catch {}
      }
    };
  }, [post.videoSrc, shouldLoad, isActive]);

  useEffect(() => {
    const v = videoRef.current;
    const bg = bgVideoRef.current;
    if (!v) return;
    const syncBgTime = () => {
      const b = bgVideoRef.current;
      if (!b || (b as any).srcObject || !v || !isFinite(v.currentTime)) return;
      try {
        if (Math.abs((b.currentTime || 0) - v.currentTime) > 0.2) {
          b.currentTime = v.currentTime;
        }
      } catch {}
    };
    const onTime = () => {
      const ratio = v.duration ? v.currentTime / v.duration : 0;
      setProgress(Math.max(0, Math.min(1, ratio)));
      syncBgTime();
    };
    const onSeeked = () => syncBgTime();
    const onBgLoaded = () => syncBgTime();

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onTime);
    v.addEventListener("seeked", onSeeked);
    bg?.addEventListener("loadedmetadata", onBgLoaded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onTime);
      v.removeEventListener("seeked", onSeeked);
      bg?.removeEventListener("loadedmetadata", onBgLoaded);
    };
  }, [usePosterBg]);

  // When card becomes inactive and not preloading, ensure it stops and unloads
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = isActive;
    // Reset time when leaving active state
    if (wasActive && !isActive) {
      const v = videoRef.current;
      if (v) {
        try {
          v.currentTime = 0;
        } catch {}
      }
    }
    // Fully unload when not active and not marked for preload
    if (!isActive && !shouldPreload) {
      const v = videoRef.current;
      const bg = bgVideoRef.current as any;
      try {
        if (v) {
          v.pause();
          v.removeAttribute("src");
          v.load();
        }
        if (bg) bg.srcObject = null;
      } catch {}
      setUsePosterBg(true);
    }
  }, [isActive, shouldPreload]);

  // Note: preloading handled via props; unload handled above when not active and not preloading

  // Approximate partial preload: when shouldPreload is true (but not active),
  // briefly play muted to buffer up to preloadSeconds, then pause and reset to 0.
  useEffect(() => {
    if (!shouldPreload || isActive) return;
    const v = videoRef.current;
    if (!v) return;
    if (preloadDoneRef.current) return;

    let cancelled = false;
    let played = false;

    const maybeStart = () => {
      if (!v || cancelled || preloadDoneRef.current) return;
      try {
        // Ensure muted for autoplay policies
        v.muted = true;
        // Encourage buffering; playback will fetch regardless of preload attr
        const p = v.play();
        played = true;
        if (p && typeof p.catch === "function") {
          p.catch(() => {});
        }
      } catch {}
    };

    const onMeta = () => maybeStart();
    const onCanPlay = () => maybeStart();
    const onTime = () => {
      if (!v || cancelled || !played) return;
      // If card became active, do not interfere with playback
      if (isActiveRef.current) return;
      if (!isFinite(preloadSeconds) || preloadSeconds <= 0) return;
      if (v.currentTime >= preloadSeconds) {
        try {
          v.pause();
          // Reset to start so when activated it starts from 0, keeping buffer
          v.currentTime = 0;
        } catch {}
        preloadDoneRef.current = true;
        // Once done, stop listening to avoid races
        v.removeEventListener("timeupdate", onTime);
        v.removeEventListener("loadedmetadata", onMeta);
        v.removeEventListener("canplay", onCanPlay);
      }
    };

    // If metadata is already available, try immediately
    if (v.readyState >= 1) maybeStart();
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("timeupdate", onTime);

    return () => {
      cancelled = true;
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [shouldPreload, isActive, preloadSeconds, post.videoSrc]);

  // Ambient color sampler (YouTube-like)
  useEffect(() => {
    if (!isActive) return;
    const v = videoRef.current;
    if (!v) return;

    // Create (or reuse) a tiny offscreen canvas
    if (!samplerCanvasRef.current) {
      samplerCanvasRef.current = document.createElement("canvas");
    }
    const c = samplerCanvasRef.current;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const sample = () => {
      if (!v.videoWidth || !v.videoHeight) return;
      // Keep a tiny resolution to keep it cheap
      const targetW = 32;
      const aspect = v.videoHeight / v.videoWidth || 9 / 16;
      const targetH = Math.max(8, Math.round(targetW * aspect));
      c.width = targetW;
      c.height = targetH;
      try {
        ctx.drawImage(v, 0, 0, targetW, targetH);
        const img = ctx.getImageData(0, 0, targetW, targetH);
        const data = img.data;
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        // Sample every Nth pixel to be extra cheap
        const step = 4 * 2; // every 2px
        for (let i = 0; i < data.length; i += step) {
          const cr = data[i];
          const cg = data[i + 1];
          const cb = data[i + 2];
          const ca = data[i + 3];
          if (ca < 16) continue; // skip nearly transparent
          r += cr;
          g += cg;
          b += cb;
          count++;
        }
        if (!count) return;
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        // Slightly desaturate and darken for a subtle glow
        const desat = 3; // 1 = original
        const avg = (r + g + b) / 3;
        r = Math.round(r * desat + avg * (1 - desat));
        g = Math.round(g * desat + avg * (1 - desat));
        b = Math.round(b * desat + avg * (1 - desat));
        // Mix with base dark to avoid overpowering UI
        const mix = 0.7; // closer to dark
        const base = 10; // ~neutral-950
        r = Math.round(r * (1 - mix) + base * mix);
        g = Math.round(g * (1 - mix) + base * mix);
        b = Math.round(b * (1 - mix) + base * mix);
        const color = `rgb(${r}, ${g}, ${b})`;
        if (color !== lastSentColorRef.current) {
          lastSentColorRef.current = color;
          dispatch(setAmbientColor(color));
        }
      } catch {
        // ignore drawImage security errors if any
      }
    };

    // Sample initially once metadata is ready, then on an interval while active
    const onReady = () => sample();
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("loadedmetadata", onReady);
    // Throttle to about once per 800ms for smooth fade and perf
    const id = window.setInterval(sample, 800);

    // Also sample when playhead is scrubbed noticeably
    const onSeeked = () => sample();
    v.addEventListener("seeked", onSeeked);

    return () => {
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("loadedmetadata", onReady);
      v.removeEventListener("seeked", onSeeked);
      window.clearInterval(id);
    };
  }, [isActive, dispatch]);

  return (
    <article className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-900 border border-white/10">
      {/* Blurred video background to avoid black bars while preserving aspect ratio */}
      {/* Keep bg <video> always mounted; toggle visibility to avoid ref churn on iOS */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 w-full h-full bg-center bg-cover blur-2xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${post.thumbnail})` }}
        hidden={!usePosterBg}
      />
      <video
        ref={bgVideoRef}
        className="absolute inset-0 z-0 w-full h-full object-cover blur-2xl scale-110 pointer-events-none"
        crossOrigin="anonymous"
        playsInline
        muted
        loop
        autoPlay={isActive && playing}
        aria-hidden
        hidden={usePosterBg}
      />
      <video
        ref={videoRef}
        className="relative z-10 object-contain w-full h-full"
        crossOrigin="anonymous"
        src={shouldLoad ? post.videoSrc : undefined}
        preload={isActive ? "auto" : shouldPreload ? "metadata" : "none"}
        poster={post.thumbnail}
        loop
        playsInline
        muted={muted}
        autoPlay={isActive && playing}
        onClick={() => isActive && setPlaying((v) => !v)}
      />

      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      <div className="absolute left-2 sm:left-4 bottom-20 sm:bottom-24 space-y-2 max-w-[80%] z-30">
        <div className="flex items-center gap-2">
          <img
            src={post.user.avatar}
            className="w-8 h-8 rounded-full border border-white/10"
          />
          <div>
            <p className="font-semibold leading-tight">{post.user.handle}</p>
            <p className="text-xs text-white/60 leading-tight">
              {post.user.name}
            </p>
          </div>
          <button className="ml-2 text-xs px-3 py-1 rounded-full bg-white text-black font-semibold hover:opacity-90">
            Follow
          </button>
        </div>
        <p className="text-sm leading-snug">
          {post.caption}{" "}
          <span className="text-white/60">{post.tags.join(" ")}</span>
        </p>
      </div>

      <div className="absolute right-2 sm:right-4 top-2 sm:top-4 flex items-center gap-2 z-30">
        <button
          onClick={() => dispatch(toggleMuted())}
          className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 hover:bg-black/60"
        >
          {muted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => isActive && setPlaying((v) => !v)}
          className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 hover:bg-black/60 disabled:opacity-50"
          disabled={!isActive}
        >
          {playing ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
        <button className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 hover:bg-black/60">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <ActionRail
        interactions={post.interactions}
        comments={post.comments}
        saves={post.saves}
      />
      <MusicTicker text={post.music} />

      <div className="absolute left-0 right-0 bottom-0 h-1.5 bg-white/10 z-30">
        <div
          className="h-full bg-white/80"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </article>
  );
}
