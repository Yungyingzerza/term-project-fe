"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "./useApi";
import type { CommentItem, CommentsPage, CommentVisibility } from "@/interfaces";

export interface UseCommentsOptions {
  postId: string;
  limit?: number;
  enabled?: boolean;
}

export interface UseCommentsResult {
  items: CommentItem[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  nextCursor: string | null;
  fetchNext: () => Promise<void>;
  refetch: () => Promise<void>;
  addComment: (input: {
    text: string;
    parentCommentId?: string | null;
    visibility?: CommentVisibility;
  }) => Promise<CommentItem>;
}

export function useComments({ postId, limit = 12, enabled = true }: UseCommentsOptions): UseCommentsResult {
  const { json } = useApi();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const inFlight = useRef<boolean>(false);

  const fetchPage = useCallback(
    async (mode: "reset" | "append") => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        const cursorToUse = mode === "reset" ? null : nextCursor;
        if (cursorToUse) params.set("cursor", cursorToUse);
        const data = await json<CommentsPage>(`/feed/${postId}/comments?${params.toString()}`);
        setHasMore(!!data?.paging?.hasMore);
        setNextCursor(data?.paging?.nextCursor ?? null);
        setItems((prev) => (mode === "reset" ? data.items ?? [] : [...prev, ...(data.items ?? [])]));
      } catch (err: unknown) {
        const normalizedError =
          err instanceof Error ? err : new Error(String(err));
        setError(normalizedError);
      } finally {
        setLoading(false);
        inFlight.current = false;
      }
    },
    [json, postId, limit, nextCursor]
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
    if (enabled) void refetch();
  }, [postId, limit, enabled, refetch]);

  const addComment = useCallback(
    async (
      {
        text,
        parentCommentId = null,
        visibility = "Public",
      }: { text: string; parentCommentId?: string | null; visibility?: CommentVisibility }
    ) => {
      const created = await json<CommentItem>(`/feed/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text, parentCommentId, visibility }),
      });
      // Append locally so UI reflects immediately
      setItems((prev) => [...prev, created]);
      return created;
    },
    [json, postId]
  );

  return useMemo(
    () => ({ items, loading, error, hasMore, nextCursor, fetchNext, refetch, addComment }),
    [items, loading, error, hasMore, nextCursor, fetchNext, refetch, addComment]
  );
}
