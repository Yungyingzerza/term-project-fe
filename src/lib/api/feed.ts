import type { PostItem } from "@/interfaces";
import { buildApiUrl } from "./utils";

export type FeedAlgo = "for-you" | "following";

export interface FeedResponse {
  algo: FeedAlgo;
  items: PostItem[];
  paging: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface PostByIdResponse {
  item: PostItem;
}

export interface GetFeedParams {
  algo?: FeedAlgo;
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
  /** Optional cookie string for SSR (e.g., `accessToken=...; refreshToken=...`). */
  cookie?: string;
}

export interface GetPostByIdParams {
  postId: string;
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

export interface OrganizationFeedResponse {
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

export interface GetOrganizationFeedParams {
  orgId: string;
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
  /** Optional cookie string for SSR (e.g., `accessToken=...; refreshToken=...`). */
  cookie?: string;
}

export interface RecordPostViewParams {
  postId: string;
  watchTimeSeconds: number;
  signal?: AbortSignal;
}

export interface RecordPostViewResponse {
  postId: string;
  views: number;
  viewer: {
    viewed: boolean;
    watchTime: number;
  };
  wasNewView: boolean;
}

export async function getFeed({ algo = "for-you", limit = 10, cursor, signal, cookie }: GetFeedParams = {}): Promise<FeedResponse> {
  const url = buildApiUrl("feed");
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

export async function getPostById({ postId, signal, cookie }: GetPostByIdParams): Promise<PostByIdResponse> {
  const url = buildApiUrl(`feed/${encodeURIComponent(postId)}`);

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
    const err = new Error(
      `Failed to fetch post ${postId}: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const data = (await res.json()) as PostByIdResponse;
  return data;
}

export async function getFeedByUserHandle({ handle, limit = 10, cursor, signal, cookie }: GetUserFeedParams): Promise<UserFeedResponse> {
  const url = buildApiUrl(`feed/user/handle/${encodeURIComponent(handle)}`);
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

export async function getFeedByOrganizationId({
  orgId,
  limit = 10,
  cursor,
  signal,
  cookie,
}: GetOrganizationFeedParams): Promise<OrganizationFeedResponse> {
  const url = buildApiUrl(`feed/organization/${encodeURIComponent(orgId)}`);
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
      `Failed to fetch organization feed ${orgId}: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  const data = (await res.json()) as OrganizationFeedResponse;
  return data;
}

export async function recordPostView({
  postId,
  watchTimeSeconds,
  signal,
}: RecordPostViewParams): Promise<RecordPostViewResponse> {
  const url = buildApiUrl(`feed/${encodeURIComponent(postId)}/views`);
  const payload = Number.isFinite(watchTimeSeconds)
    ? Math.max(0, watchTimeSeconds)
    : 0;

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ watchTimeSeconds: payload }),
    signal,
    credentials: "include",
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to record view for post ${postId}: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  const data = (await res.json()) as RecordPostViewResponse;
  return data;
}
