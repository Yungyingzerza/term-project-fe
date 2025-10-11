import type {
  ExploreResponse,
  ExploreSearchType,
  ExploreSortOption,
} from "@/interfaces/explore";
import { buildApiUrl } from "./utils";

export interface ExploreSearchParams {
  query?: string;
  type?: ExploreSearchType;
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
  sortBy?: ExploreSortOption;
  /** Optional cookie string for SSR (e.g., `accessToken=...; refreshToken=...`). */
  cookie?: string;
}

export async function searchExplore({
  query,
  type = "all",
  limit = 12,
  cursor,
  signal,
  sortBy,
  cookie,
}: ExploreSearchParams): Promise<ExploreResponse> {
  const trimmed =
    typeof query === "string" ? query.trim() : "";

  const url = buildApiUrl("explore");
  if (trimmed) {
    url.searchParams.set("q", trimmed);
  }
  if (type) {
    url.searchParams.set("type", type);
  }
  if (typeof limit === "number") {
    url.searchParams.set("limit", String(limit));
  }
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  if (sortBy) {
    url.searchParams.set("sortBy", sortBy);
  }

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
      `Failed to fetch explore results: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  return (await res.json()) as ExploreResponse;
}
