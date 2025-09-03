"use client";
import { MoreVertical, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleMuted } from "@/store/playerSlice";
import ActionRail from "./ActionRail";
import MusicTicker from "./MusicTicker";
import { VideoCardProps } from "./types";

export default function VideoCard({ post, isActive = false }: VideoCardProps) {
  const dispatch = useDispatch();
  const muted = useSelector((s: any) => s.player.muted) as boolean;
  const [playing, setPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevActiveRef = useRef<boolean>(isActive);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
  }, [muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const shouldPlay = isActive && playing;
    if (shouldPlay) {
      const playPromise = v.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } else {
      v.pause();
    }
  }, [playing, isActive]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const ratio = v.duration ? v.currentTime / v.duration : 0;
      setProgress(Math.max(0, Math.min(1, ratio)));
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onTime);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onTime);
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
          v.pause();
          v.currentTime = 0;
        } catch {}
      }
      // Also mark internal playing state to false so button reflects paused
      setPlaying(false);
    }
  }, [isActive]);

  return (
    <article className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-900 border border-white/10">
      <video
        ref={videoRef}
        className="object-cover w-full h-full"
        src={post.videoSrc}
        poster={post.thumbnail}
        loop
        playsInline
        muted={muted}
        autoPlay={isActive && playing}
        onClick={() => isActive && setPlaying((v) => !v)}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      <div className="absolute left-2 sm:left-4 bottom-20 sm:bottom-24 space-y-2 max-w-[80%]">
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

      <div className="absolute right-2 sm:right-4 top-2 sm:top-4 flex items-center gap-2">
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

      <div className="absolute left-0 right-0 bottom-0 h-1.5 bg-white/10">
        <div
          className="h-full bg-white/80"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </article>
  );
}
