"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PostItem } from "@/interfaces";
import {
  getFeed as getFeedApi,
  getFeedByUserHandle as getFeedByUserHandleApi,
} from "@/lib/api/feed";
export type { FeedAlgo, FeedResponse, GetFeedParams, UserFeedResponse, GetUserFeedParams } from "@/lib/api/feed";

/**
 * Low-level fetcher for the feed endpoint.
 * GET /feed?algo=for-you|following&limit&cursor
 */
export async function getFeed(params?: GetFeedParams): Promise<import("@/lib/api/feed").FeedResponse> {
  return getFeedApi(params);
}

export interface UseFeedOptions {
  algo?: FeedAlgo;
  limit?: number;
  /** Provide a starting cursor if resuming; otherwise begins at the first page. */
  cursor?: string | null;
  /** Whether the hook should fetch automatically. */
  enabled?: boolean;
}

// User feed by handle
export async function getFeedByUserHandle(
  params: import("@/lib/api/feed").GetUserFeedParams
): Promise<import("@/lib/api/feed").UserFeedResponse> {
  return getFeedByUserHandleApi(params);
}

export interface UseFeedResult {
  items: PostItem[];
  loading: boolean;
  error: Error | null;
  algo: FeedAlgo;
  hasMore: boolean;
  nextCursor: string | null;
  refetch: () => Promise<void>;
  fetchNext: () => Promise<void>;
  reset: () => void;
  setAlgo: (algo: FeedAlgo) => void;
}

/**
 * React hook to manage paginated feed fetching with algo/limit/cursor.
 */
export function useFeed(opts: UseFeedOptions = {}): UseFeedResult {
  const { algo: initialAlgo = "for-you", limit = 10, cursor: initialCursor = null, enabled = true } = opts;

  const [algo, setAlgo] = useState<FeedAlgo>(initialAlgo);
  const [items, setItems] = useState<PostItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Track the latest request to avoid race conditions.
  const inFlight = useRef<AbortController | null>(null);

  // previously used to auto-fetch on mount; no longer needed to avoid duplicate requests

  const doFetch = useCallback(
    async (mode: "reset" | "append") => {
      setLoading(true);
      setError(null);
      inFlight.current?.abort();
      const ctrl = new AbortController();
      inFlight.current = ctrl;
      try {
        const data = await getFeedApi({ algo, limit, cursor: mode === "reset" ? null : nextCursor, signal: ctrl.signal });
        setHasMore(!!data?.paging?.hasMore);
        setNextCursor(data?.paging?.nextCursor ?? null);
        setItems((prev) => (mode === "reset" ? data.items ?? [] : [...prev, ...(data.items ?? [])]));
      } catch (e: any) {
        if (e?.name === "AbortError") return; // canceled
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    },
    [algo, limit, nextCursor]
  );

  const refetch = useCallback(async () => doFetch("reset"), [doFetch]);
  const fetchNext = useCallback(async () => {
    if (!hasMore || loading) return;
    return doFetch("append");
  }, [doFetch, hasMore, loading]);

  const reset = useCallback(() => {
    inFlight.current?.abort();
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);
  }, []);

  // Keep internal algo in sync with external option when it changes.
  useEffect(() => {
    if (initialAlgo !== algo) setAlgo(initialAlgo);
  }, [initialAlgo, algo]);

  useEffect(() => {
    // Single controlled fetch per (algo, limit, enabled) change
    reset();
    if (enabled) {
      void refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo, enabled, limit]);

  // Remove extra auto-fetch to avoid duplicate initial requests.

  // Cleanup in-flight on unmount
  useEffect(() => () => inFlight.current?.abort(), []);

  return useMemo(
    () => ({ items, loading, error, algo, hasMore, nextCursor, refetch, fetchNext, reset, setAlgo }),
    [items, loading, error, algo, hasMore, nextCursor, refetch, fetchNext, reset]
  );
}
