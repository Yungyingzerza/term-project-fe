"use client";
import { MoreVertical, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleMuted, setAmbientColor } from "@/store/playerSlice";
import ActionRail from "./ActionRail";
import MusicTicker from "./MusicTicker";
import { VideoCardProps } from "./types";

export default function VideoCard({ post, isActive = false }: VideoCardProps) {
  const dispatch = useDispatch();
  const muted = useSelector((s: any) => s.player.muted) as boolean;
  const [playing, setPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const prevActiveRef = useRef<boolean>(isActive);
  const samplerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSentColorRef = useRef<string | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    // Background video stays muted regardless
    const bg = bgVideoRef.current;
    if (bg) bg.muted = true;
  }, [muted]);

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

  useEffect(() => {
    const v = videoRef.current;
    const bg = bgVideoRef.current;
    if (!v) return;
    const syncBgTime = () => {
      const b = bgVideoRef.current;
      if (!b || !v || !isFinite(v.currentTime)) return;
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
  }, []);

  // When card becomes inactive, ensure it stops and resets time
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = isActive;
    if (wasActive && !isActive) {
      const v = videoRef.current;
      if (v) {
        try {
          v.currentTime = 0;
        } catch {}
      }
    }
  }, [isActive]);

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
        const desat = 0.85; // 1 = original
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
      <video
        ref={bgVideoRef}
        className="absolute inset-0 z-0 w-full h-full object-cover blur-2xl scale-110 pointer-events-none"
        src={post.videoSrc}
        playsInline
        muted
        loop
        autoPlay={isActive && playing}
        aria-hidden
      />
      <video
        ref={videoRef}
        className="relative z-10 object-contain w-full h-full"
        src={post.videoSrc}
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
        likes={post.likes}
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
