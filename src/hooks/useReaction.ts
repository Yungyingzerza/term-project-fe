"use client";
import { useCallback } from "react";
import { useApi } from "./useApi";
import type { Interactions, ReactionKey } from "@/interfaces";

export type ReactionResponse = {
  postId: string;
  interactions: Interactions;
  viewer?: { reaction?: ReactionKey | null };
};

export function useReaction() {
  const { json } = useApi();

  const reactToPost = useCallback(
    async (postId: string, key: ReactionKey) =>
      json<ReactionResponse>(`/feed/${postId}/reaction`, {
        method: "PUT",
        body: JSON.stringify({ key }),
      }),
    [json]
  );

  const removeReaction = useCallback(
    async (postId: string) =>
      json<ReactionResponse>(`/feed/${postId}/reaction`, { method: "DELETE" }),
    [json]
  );

  return { reactToPost, removeReaction } as const;
}

