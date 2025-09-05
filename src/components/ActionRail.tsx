"use client";
import { Bookmark, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionRailProps, Interactions, ReactionKey } from "./types";
import ReactionIcon from "./ReactionIcon";

// UX timing constants (ms)
const LONG_PRESS_DELAY_MS = 250; // time to press-and-hold before opening picker
const LONG_PRESS_COOLDOWN_MS = 400; // disable long-press shortly after a selection to avoid accidental reopen
const PICKER_CLOSE_DELAY_MS = 120; // small hover-out delay to prevent flicker
const BURST_ANIM_MS = 700; // single-run burst animation duration

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

export default function ActionRail({
  interactions,
  comments,
  saves,
}: ActionRailProps) {
  const [reaction, setReaction] = useState<ReactionKey | null>(null);
  const [counts, setCounts] = useState<Interactions>(interactions);
  const [saved, setSaved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const [burst, setBurst] = useState<{ color: string; at: number } | null>(
    null
  );
  const hoveredKeyRef = useRef<ReactionKey | null>(null);
  const [hoveredKey, setHoveredKey] = useState<ReactionKey | null>(null);
  const longPressedRef = useRef<boolean>(false);
  const suppressClickRef = useRef<boolean>(false);
  const lastSelectAtRef = useRef<number>(0);
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

  // Derive top reactions (max 3) for a compact summary below the button
  const topReactions = (Object.keys(counts) as ReactionKey[])
    .map((k) => ({ key: k, count: counts[k] || 0 }))
    .filter((it) => it.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const startLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressedRef.current = false;
    const now = Date.now();
    if (now - lastSelectAtRef.current < LONG_PRESS_COOLDOWN_MS) return;
    longPressTimer.current = window.setTimeout(() => {
      longPressedRef.current = true;
      setPickerOpen(true);
    }, LONG_PRESS_DELAY_MS);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const inc = (k: ReactionKey, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [k]: Math.max(0, (prev[k] || 0) + delta),
    }));
  };

  const handleMainClick = () => {
    if (suppressClickRef.current) {
      // Avoid toggling after a long-press selection
      suppressClickRef.current = false;
      return;
    }
    // Toggle immediately, even if the picker is open
    if (reaction) {
      inc(reaction, -1);
      setReaction(null);
      lastSelectAtRef.current = Date.now();
      cancelLongPress();
    } else {
      inc(displayedKey, 1);
      setReaction(displayedKey);
      const col = REACTIONS.find((r) => r.key === displayedKey)!.accent;
      setBurst({ color: col, at: Date.now() });
      lastSelectAtRef.current = Date.now();
      cancelLongPress();
    }
    if (pickerOpen) setPickerOpen(false);
  };

  const choose = (k: ReactionKey) => {
    if (reaction === k) {
      // toggle off when clicking the same reaction
      inc(k, -1);
      setReaction(null);
      lastSelectAtRef.current = Date.now();
      cancelLongPress();
    } else {
      if (reaction && reaction !== k) inc(reaction, -1);
      inc(k, 1);
      setReaction(k);
      const col = REACTIONS.find((r) => r.key === k)!.accent;
      setBurst({ color: col, at: Date.now() });
      lastSelectAtRef.current = Date.now();
      cancelLongPress();
    }
    setPickerOpen(false);
  };

  // For keyboard cycling without closing the picker
  const cycleTo = (k: ReactionKey) => {
    if (reaction === k) return; // no-op
    if (reaction && reaction !== k) inc(reaction, -1);
    inc(k, 1);
    setReaction(k);
    const col = REACTIONS.find((r) => r.key === k)!.accent;
    setBurst({ color: col, at: Date.now() });
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
          closeTimer.current = window.setTimeout(
            () => setPickerOpen(false),
            PICKER_CLOSE_DELAY_MS
          );
        }}
        onTouchMove={(e) => {
          if (!longPressedRef.current) return;
          const t = e.touches && e.touches[0];
          if (!t) return;
          const el = document.elementFromPoint(
            t.clientX,
            t.clientY
          ) as HTMLElement | null;
          const btn = el?.closest(
            "button[data-reaction]"
          ) as HTMLElement | null;
          const key = (btn?.dataset?.reaction || null) as ReactionKey | null;
          if (hoveredKeyRef.current !== key) {
            hoveredKeyRef.current = key;
            setHoveredKey(key);
          }
        }}
        onTouchEnd={(e) => {
          if (!longPressedRef.current) return;
          e.preventDefault();
          e.stopPropagation();
          const key = hoveredKeyRef.current;
          if (key) {
            choose(key);
          } else {
            setPickerOpen(false);
          }
          hoveredKeyRef.current = null;
          setHoveredKey(null);
          longPressedRef.current = false;
          suppressClickRef.current = true;
        }}
        onTouchCancel={() => {
          if (!longPressedRef.current) return;
          hoveredKeyRef.current = null;
          setHoveredKey(null);
          longPressedRef.current = false;
          setPickerOpen(false);
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
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              handleMainClick();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              const keys = REACTIONS.map((r) => r.key);
              const curr = reaction || displayedKey;
              const idx = keys.indexOf(curr);
              const nextIdx =
                e.key === "ArrowRight"
                  ? (idx + 1) % keys.length
                  : (idx - 1 + keys.length) % keys.length;
              setPickerOpen(true);
              cycleTo(keys[nextIdx]);
            } else if (e.key === "Escape") {
              setPickerOpen(false);
            }
          }}
          className={classNames(
            "group grid place-items-center w-12 h-12 rounded-full bg-black/40 border border-white/10 hover:bg-black/60 select-none",
            reaction &&
              `ring-2 ${REACTIONS.find((r) => r.key === reaction)?.ring}`
          )}
          aria-label={
            reaction
              ? REACTIONS.find((r) => r.key === reaction)?.label
              : "React"
          }
          title={
            reaction
              ? `${
                  REACTIONS.find((r) => r.key === reaction)!.label
                } • Click to remove • Hold to choose`
              : `React • Click to Like • Hold to choose`
          }
          onMouseEnter={() => {
            if (closeTimer.current) window.clearTimeout(closeTimer.current);
            setPickerOpen(true);
          }}
        >
          <span className="relative inline-grid place-items-center">
            {/* Burst when selecting */}
            {burst && (
              <span
                key={burst.at}
                className="absolute -z-10 h-12 w-12 rounded-full opacity-40"
                style={{
                  backgroundColor: burst.color,
                  animation: `ping ${BURST_ANIM_MS}ms ease-out 1`,
                }}
                onAnimationEnd={() => setBurst(null)}
              />
            )}
            {/* Glow */}
            <span
              className={classNames(
                "absolute -z-10 h-8 w-8 rounded-full blur-md transition-all",
                reaction ? "opacity-60 scale-100" : "opacity-0 scale-90",
                "group-hover:opacity-80 group-hover:scale-110"
              )}
              style={{
                backgroundColor: REACTIONS.find(
                  (r) => r.key === (reaction || displayedKey)
                )!.accent,
              }}
            />
            <ReactionIcon
              name={reaction || displayedKey}
              className="w-6 h-6 text-white transition group-hover:brightness-110"
            />
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
            closeTimer.current = window.setTimeout(
              () => setPickerOpen(false),
              PICKER_CLOSE_DELAY_MS
            );
          }}
          className={classNames(
            "absolute right-full mr-2 bottom-0 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm shadow-lg transition-all duration-150",
            pickerOpen
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-1 pointer-events-none"
          )}
          role="radiogroup"
          aria-label="Reactions"
        >
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => choose(r.key)}
              className={classNames(
                "group w-12 h-14 px-1 grid place-items-center rounded-md hover:bg-white/10 hover:ring-2",
                r.ring,
                (reaction === r.key || hoveredKey === r.key) && "ring-2"
              )}
              aria-label={r.label}
              title={`${r.label} • ${formatCount(counts[r.key] || 0)}`}
              data-reaction={r.key}
              role="radio"
              aria-checked={reaction === r.key}
            >
              <span className="relative inline-grid place-items-center">
                <span
                  className="absolute -z-10 h-7 w-7 rounded-full blur-md opacity-0 scale-90 transition-all group-hover:opacity-80 group-hover:scale-110"
                  style={{ backgroundColor: r.accent }}
                />
                <ReactionIcon
                  name={r.key}
                  className="w-5 h-5 text-white transition group-hover:brightness-110"
                />
              </span>
              <span className="text-[10px] leading-[10px] text-white/80 mt-0.5">
                {formatCount(counts[r.key] || 0)}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Compact top reactions summary */}
      <div className="flex items-center gap-1">
        {topReactions.map((t, i) => (
          <span
            key={`${t.key}-${i}`}
            className="relative inline-grid place-items-center -mr-1"
            title={`${t.key} • ${t.count}`}
          >
            <span
              className="absolute -z-10 h-4 w-4 rounded-full blur-[6px] opacity-60"
              style={{
                backgroundColor: REACTIONS.find((r) => r.key === t.key)!.accent,
              }}
            />
            <ReactionIcon
              name={t.key as ReactionKey}
              className="w-3.5 h-3.5 text-white"
            />
          </span>
        ))}
      </div>
      <div className="text-xs text-white/80" aria-live="polite">
        {formatCount(total)}
      </div>

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
      <div className="text-xs text-white/80">
        {formatCount(saves + (saved ? 1 : 0))}
      </div>

      <button className="grid place-items-center w-12 h-12 rounded-full bg-black/40 border border-white/10 hover:bg-black/60">
        <Share2 className="w-6 h-6" />
      </button>
    </div>
  );
}
