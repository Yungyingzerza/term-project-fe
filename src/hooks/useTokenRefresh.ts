"use client";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setExp, setId, setPictureUrl, setUsername } from "@/store/userSlice";

/**
 * Schedules a token refresh a short time before expiry.
 * Requires the backend refresh endpoint to set new HttpOnly cookies.
 * After refresh, calls `/line/me` to get the new `exp` and updates Redux.
 */
export default function useTokenRefresh(options?: {
  /** Seconds before `exp` to refresh. Default: 60s */
  bufferSeconds?: number;
  /** Minimum delay to avoid thrashing. Default: 5s */
  minDelaySeconds?: number;
}) {
  const bufferSeconds = options?.bufferSeconds ?? 60;
  const minDelaySeconds = options?.minDelaySeconds ?? 5;

  const dispatch = useDispatch();
  const exp = useSelector((s: any) => (s?.user?.exp as number) || 0);

  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const schedule = useCallback(
    (delayMs: number) => {
      clearTimer();
      timerRef.current = window.setTimeout(async () => {
        try {
          // 1) Ask backend to refresh tokens (HttpOnly cookies)
          const refreshRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_API}/line/refresh`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (!refreshRes.ok) {
            // If refresh fails, stop scheduling; optional: clear exp
            dispatch(setExp(0));
            return;
          }

          // 2) Fetch updated user info to get new exp
          const meRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_API}/line/me`,
            {
              method: "GET",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (meRes.ok) {
            const data = await meRes.json();
            if (data) {
              if (typeof data.exp === "number") dispatch(setExp(data.exp));
              if (typeof data.id === "string") dispatch(setId(data.id));
              if (typeof data.username === "string")
                dispatch(setUsername(data.username));
              if (typeof data.picture_url === "string")
                dispatch(setPictureUrl(data.picture_url));
            }

            // After updating exp, this hook's effect will reschedule automatically
          } else {
            // If we can't fetch /me, try again soon
            schedule(minDelaySeconds * 1000);
          }
        } catch {
          // Network or other error; back off and retry soon
          schedule(minDelaySeconds * 1000);
        }
      }, Math.max(delayMs, minDelaySeconds * 1000));
    },
    [dispatch, minDelaySeconds]
  );

  useEffect(() => {
    // No exp => nothing to schedule
    if (!exp || exp <= 0) {
      clearTimer();
      return;
    }

    const now = Date.now();
    // `exp` is expected in seconds (JWT spec); convert to ms
    const expMs = exp * 1000;
    const refreshAt = expMs - bufferSeconds * 1000;
    const delay = refreshAt - now;

    if (delay <= 0) {
      // Already within buffer window; refresh soon
      schedule(minDelaySeconds * 1000);
    } else {
      schedule(delay);
    }

    return () => clearTimer();
  }, [exp, bufferSeconds, minDelaySeconds, schedule]);
}

