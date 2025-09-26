import type {
  FollowUserPayload,
  SavedVideosResponse,
  UserHandleLookupResponse,
  UserProfileResponse,
  UserReactionsResponse,
} from "@/interfaces";

interface RequestOptions {
  signal?: AbortSignal;
  cookie?: string;
}

const baseApi = process.env.NEXT_PUBLIC_BASE_API as string;

function resolveBaseUrl(): string {
  if (!baseApi) {
    throw new Error("NEXT_PUBLIC_BASE_API is not configured");
  }
  return baseApi;
}

export async function getUserIdByHandle(
  handle: string,
  { signal, cookie }: RequestOptions = {}
): Promise<UserHandleLookupResponse> {
  const base = resolveBaseUrl();
  const url = new URL(`/user/handle/${encodeURIComponent(handle)}`, base);

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
      `Failed to lookup handle ${handle}: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as UserHandleLookupResponse;
}

export async function getUserProfile(
  userId: string,
  { signal, cookie }: RequestOptions = {}
): Promise<UserProfileResponse> {
  const base = resolveBaseUrl();
  const url = new URL(`/user/profile/${encodeURIComponent(userId)}`, base);

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
      `Failed to fetch user profile: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as UserProfileResponse;
}

export async function followUser(
  payload: FollowUserPayload,
  { signal, cookie }: RequestOptions = {}
): Promise<{ message: string }> {
  const base = resolveBaseUrl();
  const url = new URL("/user/follow", base);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to ${payload.action} user: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as { message: string };
}

interface PaginationParams {
  limit?: number;
  cursor?: string | null;
}

export async function getUserSavedVideos(
  params: PaginationParams = {},
  { signal, cookie }: RequestOptions = {}
): Promise<SavedVideosResponse> {
  const base = resolveBaseUrl();
  const url = new URL("/user/saves/videos", base);
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.cursor) url.searchParams.set("cursor", params.cursor);

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
      `Failed to fetch saved videos: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as SavedVideosResponse;
}

export async function getUserReactions(
  params: PaginationParams = {},
  { signal, cookie }: RequestOptions = {}
): Promise<UserReactionsResponse> {
  const base = resolveBaseUrl();
  const url = new URL("/user/reactions/videos", base);
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.cursor) url.searchParams.set("cursor", params.cursor);

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
      `Failed to fetch reacted videos: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as UserReactionsResponse;
}
