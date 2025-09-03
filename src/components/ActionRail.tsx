"use client";
import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { ActionRailProps } from "./types";

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function ActionRail({ likes, comments, saves }: ActionRailProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className="absolute right-2 sm:right-4 bottom-24 sm:bottom-6 flex flex-col items-center gap-4">
      <button
        onClick={() => setLiked((v) => !v)}
        className={classNames(
          "grid place-items-center w-12 h-12 rounded-full bg-black/40 border border-white/10 hover:bg-black/60",
          liked && "ring-2 ring-rose-500/60"
        )}
      >
        <Heart className={classNames("w-6 h-6", liked && "fill-current text-rose-500")} />
      </button>
      <div className="text-xs text-white/80">{formatCount(likes + (liked ? 1 : 0))}</div>

      <button className="grid place-items-center w-12 h-12 rounded-full bg-black/40 border border-white/10 hover:bg-black/60">
        <MessageCircle className="w-6 h-6" />
      </button>
      <div className="text-xs text-white/80">{formatCount(comments)}</div>

      <button
        onClick={() => setSaved((v) => !v)}
        className={classNames(
          "grid place-items-center w-12 h-12 rounded-full bg-black/40 border border-white/10 hover:bg-black/60",
          saved && "ring-2 ring-white/60"
        )}
      >
        <Bookmark className={classNames("w-6 h-6", saved && "fill-current")} />
      </button>
      <div className="text-xs text-white/80">{formatCount(saves + (saved ? 1 : 0))}</div>

      <button className="grid place-items-center w-12 h-12 rounded-full bg-black/40 border border-white/10 hover:bg-black/60">
        <Share2 className="w-6 h-6" />
      </button>
    </div>
  );
}

