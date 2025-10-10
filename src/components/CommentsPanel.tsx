"use client";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { CommentItem, CommentVisibility } from "@/interfaces";
import { useComments, type UseCommentsResult } from "@/hooks/useComments";
import { useReplies } from "@/hooks/useReplies";
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
    if (s < 60) return `${s} วิ`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m} นาที`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} ชม.`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d} วัน`;
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
        aria-label="ความคิดเห็น"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <div className="font-semibold text-white">ความคิดเห็น</div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10"
            aria-label="ปิดความคิดเห็น"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* List */}
        <div ref={scrollerRef} className="px-3 py-2 h-[55vh] sm:h-[calc(100%-98px)] overflow-y-auto space-y-3">
          {items.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              postId={postId}
              addComment={addComment}
              isLoggedIn={isLoggedIn}
            />
          ))}
          <div className="py-2">
            {hasMore ? (
              <button
                onClick={() => fetchNext()}
                disabled={loading}
                className="w-full text-sm py-1.5 rounded bg-white/10 hover:bg-white/15 disabled:opacity-60 text-white"
              >
                {loading ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
              </button>
            ) : (
              <div className="text-center text-xs text-white/70">ไม่มีความคิดเห็นเพิ่มเติม</div>
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
                <option value="Public">สาธารณะ</option>
                <option value="OwnerOnly">เฉพาะเจ้าของ</option>
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
                placeholder="เขียนความคิดเห็น..."
                className="flex-1 text-sm px-3 py-2 rounded bg-black/40 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder:text-white/50"
              />
              <button
                onClick={onSubmit}
                disabled={!text.trim()}
                className="text-sm px-3 py-2 rounded bg-white text-black font-semibold hover:opacity-90 disabled:opacity-60"
              >
                ส่ง
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-white/70">เข้าสู่ระบบเพื่อแสดงความคิดเห็น</div>
              <a
                href={`${process.env.NEXT_PUBLIC_BASE_API}/line/authentication`}
                className="text-sm px-3 py-2 rounded bg-white text-black font-semibold hover:opacity-90"
              >
                เข้าสู่ระบบ
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

interface CommentThreadProps {
  comment: CommentItem;
  postId: string;
  addComment: UseCommentsResult["addComment"];
  isLoggedIn: boolean;
}

function CommentContent({ comment }: { comment: CommentItem }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold truncate max-w-[10rem] text-white">{comment.user.handle}</span>
        <span className="text-white/50 text-xs">{timeAgo(comment.createdAt)}</span>
        {comment.visibility === "OwnerOnly" && (
          <span className="text-[10px] px-1 py-0.5 rounded bg-white/10 text-white/80">เจ้าของ</span>
        )}
      </div>
      <div className="text-sm whitespace-pre-wrap break-words text-white">{comment.text}</div>
    </div>
  );
}

function CommentThread({ comment, postId, addComment, isLoggedIn }: CommentThreadProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const replyInputRef = useRef<HTMLInputElement | null>(null);
  const replyPosting = useRef<boolean>(false);
  const repliesEndRef = useRef<HTMLDivElement | null>(null);

  const { items: replies, loading, hasMore, fetchNext, appendReply } = useReplies({
    postId,
    commentId: comment.id,
    enabled: showReplies,
  });

  useEffect(() => {
    if (replyOpen) {
      setShowReplies(true);
      setTimeout(() => replyInputRef.current?.focus(), 60);
    } else {
      setReplyText("");
    }
  }, [replyOpen]);

  const onSubmitReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed || replyPosting.current) return;
    replyPosting.current = true;
    try {
      if (!showReplies) setShowReplies(true);
      const created = await addComment({
        text: trimmed,
        parentCommentId: comment.id,
      });
      appendReply(created);
      setReplyText("");
      requestAnimationFrame(() => {
        const endEl = repliesEndRef.current;
        if (endEl) endEl.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    } catch (err) {
      console.error(err);
    } finally {
      replyPosting.current = false;
    }
  };

  const repliesCount = comment.repliesCount ?? 0;
  const canToggleReplies = repliesCount > 0 || showReplies;

  return (
    <div className="flex items-start gap-2">
      <Image
        src={comment.user.avatar}
        alt={`ภาพโปรไฟล์ของ ${comment.user.handle}`}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full border border-white/10"
        unoptimized
      />
      <div className="flex-1 min-w-0">
        <CommentContent comment={comment} />
        <div className="mt-1 flex items-center gap-3 text-xs text-white/60">
          {isLoggedIn && (
            <button
              onClick={() => setReplyOpen((prev) => !prev)}
              className="hover:text-white transition-colors"
            >
              {replyOpen ? "ยกเลิกการตอบกลับ" : "ตอบกลับ"}
            </button>
          )}
          {canToggleReplies && (
            <button
              onClick={() => setShowReplies((prev) => !prev)}
              className="hover:text-white transition-colors"
            >
              {showReplies ? "ซ่อนการตอบกลับ" : `ดูการตอบกลับ (${repliesCount})`}
            </button>
          )}
        </div>
        {replyOpen && isLoggedIn && (
          <div className="mt-2 flex items-center gap-2">
            <input
              ref={replyInputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmitReply();
                }
              }}
              placeholder="ตอบกลับ..."
              className="flex-1 text-sm px-3 py-2 rounded bg-black/40 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder:text-white/50"
            />
            <button
              onClick={onSubmitReply}
              disabled={!replyText.trim()}
              className="text-sm px-3 py-2 rounded bg-white text-black font-semibold hover:opacity-90 disabled:opacity-60"
            >
              ส่ง
            </button>
          </div>
        )}
        {showReplies && (
          <div className="mt-3 space-y-3 border-l border-white/10 pl-3">
            {replies.map((reply) => (
              <div key={reply.id} className="flex items-start gap-2">
                <Image
                  src={reply.user.avatar}
                  alt={`ภาพโปรไฟล์ของ ${reply.user.handle}`}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full border border-white/10"
                  unoptimized
                />
                <CommentContent comment={reply} />
              </div>
            ))}
            {!loading && replies.length === 0 && repliesCount === 0 && (
              <div className="text-xs text-white/60">ยังไม่มีการตอบกลับ</div>
            )}
            {hasMore ? (
              <button
                onClick={() => fetchNext()}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 disabled:opacity-60 text-white"
              >
                {loading ? "กำลังโหลด..." : "โหลดการตอบกลับเพิ่มเติม"}
              </button>
            ) : (
              replies.length > 0 && (
                <div className="text-xs text-white/60">ไม่มีการตอบกลับเพิ่มเติม</div>
              )
            )}
            <div ref={repliesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
