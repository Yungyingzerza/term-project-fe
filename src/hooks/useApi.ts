"use client";
import { useCallback } from "react";

export interface JsonOptions extends RequestInit {
  /** If true, returns the raw Response instead of parsing JSON. */
  raw?: boolean;
}

function buildUrl(input: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_API || "").trim();
  if (!base) return input; // allow absolute or relative when base missing
  try {
    // If input is already absolute, new URL will succeed
    const u = new URL(input);
    return u.toString();
  } catch {
    // Treat as relative to base
    const url = new URL(input.startsWith("/") ? input : `/${input}`, base);
    return url.toString();
  }
}

/**
 * React hook exposing a small API client that
 * - prefixes `NEXT_PUBLIC_BASE_API` for relative paths
 * - sends cookies (`credentials: include`)
 * - on 401 Unauthorized, calls `/line/refresh` then retries once
 */
export function useApi() {
  const json = useCallback(async <T = unknown>(input: string, init: JsonOptions = {}): Promise<T> => {
    const { raw, headers, credentials, ...rest } = init;
    const url = buildUrl(input);
    const doFetch = async (): Promise<Response> =>
      fetch(url, {
        credentials: credentials ?? "include",
        headers: {
          "Content-Type": "application/json",
          ...(headers || {}),
        },
        ...rest,
      });

    let res = await doFetch();
    if (res.status === 401) {
      // Try to refresh
      const refreshUrl = buildUrl("/line/refresh");
      try {
        const r = await fetch(refreshUrl, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (r.ok) {
          // retry original once
          res = await doFetch();
        }
      } catch {
        // swallow and fall through to handling below
      }
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }
    if (raw) return res as unknown as T;
    const data: unknown = await res.json();
    return data as T;
  }, []);

  // Keep useApi generic; feature-specific hooks should build on top of this.
  return { json } as const;
}
