"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "./useApi";
import type { CommentItem, CommentsPage } from "@/interfaces";

export interface UseRepliesOptions {
  postId: string;
  commentId: string;
  limit?: number;
  enabled?: boolean;
}

export interface UseRepliesResult {
  items: CommentItem[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  nextCursor: string | null;
  fetchNext: () => Promise<void>;
  refetch: () => Promise<void>;
  addReply: (input: { text: string }) => Promise<CommentItem>;
  appendReply: (reply: CommentItem) => void;
}

export function useReplies({
  postId,
  commentId,
  limit = 10,
  enabled = true,
}: UseRepliesOptions): UseRepliesResult {
  const { json } = useApi();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const inFlight = useRef<boolean>(false);

  const normalizeItem = useCallback(
    (item: CommentItem) => ({
      ...item,
      repliesCount: item.repliesCount ?? 0,
    }),
    []
  );

  const normalizeList = useCallback(
    (list: CommentItem[] = []) => list.map((item) => normalizeItem(item)),
    [normalizeItem]
  );

  const appendReply = useCallback(
    (reply: CommentItem) => {
      setItems((prev) => [...prev, normalizeItem(reply)]);
    },
    [normalizeItem]
  );

  const fetchPage = useCallback(
    async (mode: "reset" | "append") => {
      if (inFlight.current || !enabled) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        const cursorToUse = mode === "reset" ? null : nextCursor;
        if (cursorToUse) params.set("cursor", cursorToUse);
        const data = await json<CommentsPage>(
          `/feed/${postId}/comments/${commentId}/replies?${params.toString()}`
        );
        setHasMore(!!data?.paging?.hasMore);
        setNextCursor(data?.paging?.nextCursor ?? null);
        const normalizedItems = normalizeList(data?.items ?? []);
        setItems((prev) => (mode === "reset" ? normalizedItems : [...prev, ...normalizedItems]));
      } catch (err: unknown) {
        const normalizedError =
          err instanceof Error ? err : new Error(String(err));
        setError(normalizedError);
      } finally {
        setLoading(false);
        inFlight.current = false;
      }
    },
    [commentId, enabled, json, limit, nextCursor, normalizeList, postId]
  );

  const refetch = useCallback(async () => fetchPage("reset"), [fetchPage]);
  const fetchNext = useCallback(async () => {
    if (!hasMore || loading) return;
    return fetchPage("append");
  }, [fetchPage, hasMore, loading]);

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);
    if (enabled) void refetch();
  }, [commentId, enabled, limit, refetch]);

  const addReply = useCallback(
    async ({ text }: { text: string }) => {
      const created = await json<CommentItem>(`/feed/${postId}/comments/${commentId}/replies`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      const normalized = normalizeItem(created);
      appendReply(normalized);
      return normalized;
    },
    [appendReply, commentId, json, normalizeItem, postId]
  );

  return useMemo(
    () => ({
      items,
      loading,
      error,
      hasMore,
      nextCursor,
      fetchNext,
      refetch,
      addReply,
      appendReply,
    }),
    [items, loading, error, hasMore, nextCursor, fetchNext, refetch, addReply, appendReply]
  );
}
