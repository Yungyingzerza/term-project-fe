"use client";
import { useCallback } from "react";
import { useApi } from "./useApi";

export type SaveResponse = {
  postId: string;
  saves: number;
  viewer?: { saved?: boolean };
};

export function useSave() {
  const { json } = useApi();

  const savePost = useCallback(
    async (postId: string) =>
      json<SaveResponse>(`/feed/${postId}/save`, { method: "PUT" }),
    [json]
  );

  const removeSave = useCallback(
    async (postId: string) =>
      json<SaveResponse>(`/feed/${postId}/save`, { method: "DELETE" }),
    [json]
  );

  return { savePost, removeSave } as const;
}

