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
  /** Optional cookie string for SSR (e.g., `accessToken=...; refreshToken=...`). */
  cookie?: string;
}

export interface UserFeedResponse {
  items: PostItem[];
  paging: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface GetUserFeedParams {
  handle: string;
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
  /** Optional cookie string for SSR (e.g., `accessToken=...; refreshToken=...`). */
  cookie?: string;
}

export async function getFeed({ algo = "for-you", limit = 10, cursor, signal, cookie }: GetFeedParams = {}): Promise<FeedResponse> {
  const base = process.env.NEXT_PUBLIC_BASE_API as string;
  const url = new URL("/feed", base);
  url.searchParams.set("algo", algo);
  if (limit != null) url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    // credentials is safe on client; server ignores it
    credentials: "include",
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch feed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  const data = (await res.json()) as FeedResponse;
  return data;
}

export async function getFeedByUserHandle({ handle, limit = 10, cursor, signal, cookie }: GetUserFeedParams): Promise<UserFeedResponse> {
  const base = process.env.NEXT_PUBLIC_BASE_API as string;
  const url = new URL(`/feed/user/handle/${encodeURIComponent(handle)}`, base);
  if (limit != null) url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch user feed by handle: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  const data = (await res.json()) as UserFeedResponse;
  return data;
}

