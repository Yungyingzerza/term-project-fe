"use client";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { CommentItem, CommentVisibility } from "@/interfaces";
import { useComments } from "@/hooks/useComments";
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

interface ReplyIntentPayload {
  comment: CommentItem;
  depth: number;
  appendReply: (reply: CommentItem) => void;
  incrementReplyCount: () => void;
  ensureVisible?: () => void;
  scrollRepliesToEnd?: () => void;
}

export default function CommentsPanel({ postId, open, onClose, onAdded }: CommentsPanelProps) {
  const { items, loading, hasMore, fetchNext, addComment } = useComments({ postId, limit: 12, enabled: open });
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<CommentVisibility>("Public");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const postingRef = useRef<boolean>(false);
  const commentDraftRef = useRef<string>("");
  const [replyTarget, setReplyTarget] = useState<ReplyIntentPayload | null>(null);
  const [mounted, setMounted] = useState(false);
  const user = useAppSelector((s) => s.user);
  const isLoggedIn = !!(user?.id || user?.username);
  const handleReplyIntent = useCallback(
    (payload: ReplyIntentPayload) => {
      if (!replyTarget) {
        commentDraftRef.current = text;
      }
      setText("");
      setReplyTarget(payload);
      setTimeout(() => inputRef.current?.focus(), 50);
      payload.ensureVisible?.();
      requestAnimationFrame(() => {
        composerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    },
    [replyTarget, text]
  );
  const handleReplyCancel = useCallback(() => {
    setReplyTarget(null);
    setText(commentDraftRef.current);
    commentDraftRef.current = "";
    setTimeout(() => inputRef.current?.focus(), 50);
    requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setText("");
      setVisibility("Public");
      setReplyTarget(null);
      commentDraftRef.current = "";
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
      const created = await addComment({
        text: trimmed,
        visibility,
        parentCommentId: replyTarget?.comment.id,
      });
      if (replyTarget) {
        replyTarget.appendReply(created);
        replyTarget.incrementReplyCount();
        requestAnimationFrame(() => {
          replyTarget.scrollRepliesToEnd?.();
        });
      } else {
        onAdded?.(created);
        commentDraftRef.current = "";
        // Scroll to bottom to reveal the new comment
        requestAnimationFrame(() => {
          const s = scrollerRef.current;
          if (s) s.scrollTop = s.scrollHeight;
        });
      }
      setText("");
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
          "flex flex-col overflow-hidden",
          "transition-transform",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        )}
        style={{ maxHeight: "min(100svh, 100vh)" }}
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
        <div
          ref={scrollerRef}
          className="comments-scrollbar scroll-smoothbar flex-1 px-3 py-2 overflow-y-auto space-y-3"
        >
          {items.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              postId={postId}
              isLoggedIn={isLoggedIn}
              onReplyIntent={handleReplyIntent}
              onReplyCancel={handleReplyCancel}
              activeReplyId={replyTarget?.comment.id ?? null}
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
            <div ref={composerRef} className="space-y-2">
              {replyTarget && (
                <div className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">
                      กำลังตอบกลับ {replyTarget.comment.user.handle}
                    </div>
                    <div className="mt-0.5 text-xs text-white/70 whitespace-pre-wrap break-words max-h-16 overflow-hidden">
                      {replyTarget.comment.text || "ไม่มีข้อความ"}
                    </div>
                  </div>
                  <button
                    onClick={handleReplyCancel}
                    className="text-xs text-white/70 hover:text-white transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {!replyTarget && (
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as CommentVisibility)}
                    className="text-xs px-2 py-1 rounded bg-black/40 border border-white/10 hover:bg-black/60 text-white"
                  >
                    <option value="Public">สาธารณะ</option>
                    <option value="OwnerOnly">เฉพาะเจ้าของ</option>
                  </select>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
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
                    placeholder={replyTarget ? "ตอบกลับ..." : "เขียนความคิดเห็น..."}
                    className="flex-1 min-w-0 w-full text-sm px-3 py-2 rounded bg-black/40 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder:text-white/50"
                  />
                  <button
                    onClick={onSubmit}
                    disabled={!text.trim()}
                    className="text-sm px-3 py-2 rounded bg-white text-black font-semibold hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
                  >
                    {replyTarget ? "ตอบกลับ" : "ส่ง"}
                  </button>
                </div>
              </div>
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
  isLoggedIn: boolean;
  depth?: number;
  onReplyIntent?: (payload: ReplyIntentPayload) => void;
  onReplyCancel?: () => void;
  activeReplyId?: string | null;
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

function CommentThread({
  comment,
  postId,
  isLoggedIn,
  depth = 0,
  onReplyIntent,
  onReplyCancel,
  activeReplyId,
}: CommentThreadProps) {
  const [showReplies, setShowReplies] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [repliesCount, setRepliesCount] = useState<number>(comment.repliesCount ?? 0);

  const { items: replies, loading, hasMore, fetchNext, appendReply } = useReplies({
    postId,
    commentId: comment.id,
    enabled: showReplies,
  });

  useEffect(() => {
    setRepliesCount(comment.repliesCount ?? 0);
  }, [comment.repliesCount]);

  const canToggleReplies = repliesCount > 0 || showReplies;
  const avatarSize = depth > 0 ? 28 : 32;
  const isActiveReplyTarget = activeReplyId === comment.id;
  const MAX_INDENT_LEVEL = 4;
  const indentLevel = Math.min(depth, MAX_INDENT_LEVEL);
  const indentOffsetPx = depth > 0 ? indentLevel * 18 : 0;
  const threadIndentStyle = depth > 0 ? ({ transform: `translateX(${indentOffsetPx}px)` } as const) : undefined;

  const ensureVisible = () => {
    const el = containerRef.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const scrollRepliesToEnd = () => {
    const endEl = repliesEndRef.current;
    if (endEl) {
      endEl.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  const handleReplyClick = () => {
    if (!isLoggedIn) return;
    if (isActiveReplyTarget) {
      onReplyCancel?.();
      return;
    }
    setShowReplies(true);
    onReplyIntent?.({
      comment,
      depth,
      appendReply: (reply) => {
        setShowReplies(true);
        appendReply(reply);
      },
      incrementReplyCount: () => setRepliesCount((prev) => prev + 1),
      ensureVisible,
      scrollRepliesToEnd,
    });
  };

  return (
    <div ref={containerRef} className="relative" style={threadIndentStyle}>
      {depth > 0 && (
        <span
          className="pointer-events-none absolute -left-3 top-3 bottom-0 w-px bg-white/15"
          aria-hidden
        />
      )}
      <div className="flex items-start gap-2">
        <Image
          src={comment.user.avatar}
          alt={`ภาพโปรไฟล์ของ ${comment.user.handle}`}
          width={avatarSize}
          height={avatarSize}
          className={classNames(depth > 0 ? "w-7 h-7" : "w-8 h-8", "rounded-full border border-white/10")}
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <CommentContent comment={comment} />
          <div className="mt-1 flex items-center gap-3 text-xs text-white/60">
            {isLoggedIn && (
              <button
                onClick={handleReplyClick}
                className="hover:text-white transition-colors"
              >
                {isActiveReplyTarget ? "ยกเลิกการตอบกลับ" : "ตอบกลับ"}
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
          {isActiveReplyTarget && (
            <div className="mt-1 text-xs text-white/60">กำลังตอบกลับผ่านช่องด้านล่าง</div>
          )}
          {showReplies && (
            <div className="relative mt-3 space-y-3">
              <span
                className="pointer-events-none absolute -left-3 top-0 bottom-0 w-px bg-white/15"
                aria-hidden
              />
              {replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  isLoggedIn={isLoggedIn}
                  depth={depth + 1}
                  onReplyIntent={onReplyIntent}
                  onReplyCancel={onReplyCancel}
                  activeReplyId={activeReplyId}
                />
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
    </div>
  );
}
