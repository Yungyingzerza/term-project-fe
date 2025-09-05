"use client";
import { Bookmark, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionRailProps, Interactions, ReactionKey } from "./types";
import ReactionIcon from "./ReactionIcon";

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const REACTIONS: Array<{
  key: ReactionKey;
  label: string;
  accent: string; // hex color for glow
  ring: string; // tailwind ring color
}> = [
  { key: "like", label: "Like", accent: "#0ea5e9", ring: "ring-sky-500/60" },
  { key: "love", label: "Love", accent: "#f43f5e", ring: "ring-rose-500/60" },
  { key: "haha", label: "Haha", accent: "#facc15", ring: "ring-yellow-400/60" },
  { key: "sad", label: "Sad", accent: "#93c5fd", ring: "ring-blue-300/60" },
  { key: "angry", label: "Angry", accent: "#dc2626", ring: "ring-red-600/60" },
];

export default function ActionRail({ interactions, comments, saves }: ActionRailProps) {
  const [reaction, setReaction] = useState<ReactionKey | null>(null);
  const [counts, setCounts] = useState<Interactions>(interactions);
  const [saved, setSaved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const total = (Object.keys(counts) as ReactionKey[]).reduce(
    (acc, k) => acc + (counts[k] || 0),
    0
  );
  const topKey: ReactionKey = (Object.keys(counts) as ReactionKey[]).reduce(
    (best, k) => (counts[k] > counts[best] ? k : best),
    "like"
  );
  const displayedKey: ReactionKey = reaction || topKey;
  const displayed = REACTIONS.find((r) => r.key === displayedKey)!;
  useEffect(() => setCounts(interactions), [interactions]);

  const startLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => setPickerOpen(true), 450);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const inc = (k: ReactionKey, delta: number) => {
    setCounts((prev) => ({ ...prev, [k]: Math.max(0, (prev[k] || 0) + delta) }));
  };

  const handleMainClick = () => {
    if (pickerOpen) {
      setPickerOpen(false);
      return;
    }
    if (reaction) {
      inc(reaction, -1);
      setReaction(null);
    } else {
      inc(displayedKey, 1);
      setReaction(displayedKey);
    }
  };

  const choose = (k: ReactionKey) => {
    if (reaction && reaction !== k) inc(reaction, -1);
    if (!reaction || reaction !== k) inc(k, 1);
    setReaction(k);
    setPickerOpen(false);
  };

  return (
    <div className="absolute right-2 sm:right-4 bottom-24 sm:bottom-6 flex flex-col items-center gap-4 z-30">
      <div
        className="relative"
        onMouseEnter={() => {
          if (closeTimer.current) window.clearTimeout(closeTimer.current);
        }}
        onMouseLeave={() => {
          if (closeTimer.current) window.clearTimeout(closeTimer.current);
          closeTimer.current = window.setTimeout(() => setPickerOpen(false), 120);
        }}
      >
        {/* Main reaction button */}
        <button
          onClick={handleMainClick}
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchCancel={cancelLongPress}
          className={classNames(
            "group grid place-items-center w-12 h-12 rounded-full bg-black/40 border border-white/10 hover:bg-black/60 select-none",
            reaction && `ring-2 ${REACTIONS.find((r) => r.key === reaction)?.ring}`
          )}
          aria-label={reaction ? REACTIONS.find((r) => r.key === reaction)?.label : "React"}
          onMouseEnter={() => {
            if (closeTimer.current) window.clearTimeout(closeTimer.current);
            setPickerOpen(true);
          }}
        >
          <span className="relative inline-grid place-items-center">
            {/* Glow */}
            <span
              className={classNames(
                "absolute -z-10 h-8 w-8 rounded-full blur-md transition-all",
                reaction ? "opacity-60 scale-100" : "opacity-0 scale-90",
                "group-hover:opacity-80 group-hover:scale-110"
              )}
              style={{ backgroundColor: (REACTIONS.find((r) => r.key === (reaction || displayedKey))!.accent) }}
            />
            <ReactionIcon name={reaction || displayedKey} className="w-6 h-6 text-white transition group-hover:brightness-110" />
          </span>
        </button>

        {/* Reactions picker - shows on hover (desktop) or when long-pressed (mobile) */}
        <div
          onMouseEnter={() => {
            if (closeTimer.current) window.clearTimeout(closeTimer.current);
            setPickerOpen(true);
          }}
          onMouseLeave={() => {
            if (closeTimer.current) window.clearTimeout(closeTimer.current);
            closeTimer.current = window.setTimeout(() => setPickerOpen(false), 120);
          }}
          className={classNames(
            "absolute right-full mr-2 bottom-0 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm shadow-lg transition-all duration-150",
            pickerOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1 pointer-events-none"
          )}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => choose(r.key)}
              className={classNames(
                "group w-12 h-14 px-1 grid place-items-center rounded-md hover:bg-white/10",
                reaction === r.key && `ring-2 ${r.ring}`
              )}
              aria-label={r.label}
            >
              <span className="relative inline-grid place-items-center">
                <span
                  className="absolute -z-10 h-7 w-7 rounded-full blur-md opacity-0 scale-90 transition-all group-hover:opacity-80 group-hover:scale-110"
                  style={{ backgroundColor: r.accent }}
                />
                <ReactionIcon name={r.key} className="w-5 h-5 text-white transition group-hover:brightness-110" />
              </span>
              <span className="text-[10px] leading-[10px] text-white/80 mt-0.5">
                {formatCount(counts[r.key] || 0)}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="text-xs text-white/80">{formatCount(total)}</div>

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
        aria-label={saved ? "Unsave" : "Save"}
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
