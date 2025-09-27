import type { UserOrganizationsResponse } from "@/interfaces";
import { buildApiUrl } from "./utils";

export interface GetUserOrganizationsParams {
  signal?: AbortSignal;
  /** Optional cookie header string for SSR requests */
  cookie?: string;
}

export async function getUserOrganizations({
  signal,
  cookie,
}: GetUserOrganizationsParams = {}): Promise<UserOrganizationsResponse> {
  const url = buildApiUrl("user/organizations");

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
      `Failed to fetch user organizations: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  const data = (await res.json()) as UserOrganizationsResponse;
  return data;
}
