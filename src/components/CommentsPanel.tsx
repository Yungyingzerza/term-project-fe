"use client";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { CommentItem, CommentVisibility } from "@/interfaces";
import { useComments } from "@/hooks/useComments";
import { useAppSelector } from "@/store/hooks";

export interface CommentsPanelProps {
  postId: string;
  open: boolean;
  onClose: () => void;
  onAdded?: (c: CommentItem) => void;
}

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

function timeAgo(iso: string): string {
  try {
    const ts = new Date(iso).getTime();
    const now = Date.now();
    const s = Math.max(1, Math.round((now - ts) / 1000));
    if (s < 60) return `${s}s`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
}

export default function CommentsPanel({ postId, open, onClose, onAdded }: CommentsPanelProps) {
  const { items, loading, hasMore, fetchNext, addComment } = useComments({ postId, limit: 12, enabled: open });
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<CommentVisibility>("Public");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const postingRef = useRef<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const user = useAppSelector((s) => s.user);
  const isLoggedIn = !!(user?.id || user?.username);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setText("");
      setVisibility("Public");
    }
  }, [open]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const onSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || postingRef.current) return;
    postingRef.current = true;
    try {
      const created = await addComment({ text: trimmed, visibility });
      onAdded?.(created);
      setText("");
      // Scroll to bottom to reveal the new comment
      requestAnimationFrame(() => {
        const s = scrollerRef.current;
        if (s) s.scrollTop = s.scrollHeight;
      });
    } catch (e) {
      console.error(e);
    } finally {
      postingRef.current = false;
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className={classNames(
        "fixed inset-0 z-50 touch-auto",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={classNames(
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        data-prevent-feed-swipe
        className={classNames(
          "absolute right-0 bottom-0 sm:top-0 sm:bottom-0 w-full sm:w-[380px] bg-black/55 border border-white/10 backdrop-blur-md shadow-xl text-white",
          "rounded-t-2xl sm:rounded-2xl",
          "transition-transform",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        )}
        role="dialog"
        aria-label="Comments"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <div className="font-semibold text-white">Comments</div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10"
            aria-label="Close comments"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* List */}
        <div ref={scrollerRef} className="px-3 py-2 h-[55vh] sm:h-[calc(100%-98px)] overflow-y-auto space-y-3">
          {items.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Image
                src={c.user.avatar}
                alt={`${c.user.handle}'s avatar`}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border border-white/10"
                unoptimized
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold truncate max-w-[10rem] text-white">{c.user.handle}</span>
                  <span className="text-white/50 text-xs">{timeAgo(c.createdAt)}</span>
                  {c.visibility === "OwnerOnly" && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-white/10 text-white/80">Owner</span>
                  )}
                </div>
                <div className="text-sm whitespace-pre-wrap break-words text-white">{c.text}</div>
              </div>
            </div>
          ))}
          <div className="py-2">
            {hasMore ? (
              <button
                onClick={() => fetchNext()}
                disabled={loading}
                className="w-full text-sm py-1.5 rounded bg-white/10 hover:bg-white/15 disabled:opacity-60 text-white"
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            ) : (
              <div className="text-center text-xs text-white/70">No more comments</div>
            )}
          </div>
        </div>
        {/* Composer */}
        <div className="px-3 pb-3 pt-2 border-t border-white/10">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as CommentVisibility)}
                className="text-xs px-2 py-1 rounded bg-black/40 border border-white/10 hover:bg-black/60 text-white"
              >
                <option value="Public">Public</option>
                <option value="OwnerOnly">Owner only</option>
              </select>
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                placeholder="Add a comment..."
                className="flex-1 text-sm px-3 py-2 rounded bg-black/40 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder:text-white/50"
              />
              <button
                onClick={onSubmit}
                disabled={!text.trim()}
                className="text-sm px-3 py-2 rounded bg-white text-black font-semibold hover:opacity-90 disabled:opacity-60"
              >
                Send
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-white/70">Sign in to comment</div>
              <a
                href={`${process.env.NEXT_PUBLIC_BASE_API}/line/authentication`}
                className="text-sm px-3 py-2 rounded bg-white text-black font-semibold hover:opacity-90"
              >
                Sign in
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
