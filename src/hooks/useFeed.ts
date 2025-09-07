"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PostItem } from "@/interfaces";

export type FeedAlgo = "for-you" | "following";

export interface FeedResponse {
  algo: FeedAlgo;
  items: PostItem[];
  paging: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface GetFeedParams {
  algo?: FeedAlgo;
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
}

/**
 * Low-level fetcher for the feed endpoint.
 * GET /feed?algo=for-you|following&limit&cursor
 */
export async function getFeed({ algo = "for-you", limit = 10, cursor, signal }: GetFeedParams = {}): Promise<FeedResponse> {
  // Use the public base API from env
  const base = process.env.NEXT_PUBLIC_BASE_API as string;

  const url = new URL("/feed", base);
  url.searchParams.set("algo", algo);
  if (limit != null) url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch feed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  const data = (await res.json()) as FeedResponse;
  return data;
}

export interface UseFeedOptions {
  algo?: FeedAlgo;
  limit?: number;
  /** Provide a starting cursor if resuming; otherwise begins at the first page. */
  cursor?: string | null;
  /** Whether the hook should fetch automatically. */
  enabled?: boolean;
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

  const canAutoFetch = enabled && !loading && items.length === 0;

  const doFetch = useCallback(
    async (mode: "reset" | "append") => {
      setLoading(true);
      setError(null);
      inFlight.current?.abort();
      const ctrl = new AbortController();
      inFlight.current = ctrl;
      try {
        const data = await getFeed({ algo, limit, cursor: mode === "reset" ? null : nextCursor, signal: ctrl.signal });
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

  // Auto-fetch on mount or when algo changes.
  useEffect(() => {
    // When algo changes via external opts, keep state in sync
    setAlgo(initialAlgo);
  }, [initialAlgo]);

  useEffect(() => {
    reset();
    if (enabled) {
      void refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo, enabled, limit]);

  // Initial load if nothing fetched yet
  useEffect(() => {
    if (canAutoFetch) void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAutoFetch]);

  // Cleanup in-flight on unmount
  useEffect(() => () => inFlight.current?.abort(), []);

  return useMemo(
    () => ({ items, loading, error, algo, hasMore, nextCursor, refetch, fetchNext, reset, setAlgo }),
    [items, loading, error, algo, hasMore, nextCursor, refetch, fetchNext, reset]
  );
}
