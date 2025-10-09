import type { UserMeta } from "./user";
import type { Interactions, ReactionKey } from "./reactions";

export interface PostItem {
  id: string;
  user: UserMeta;
  caption: string;
  music: string;
  interactions: Interactions;
  comments: number;
  saves: number;
  thumbnail: string;
  tags: string[];
  videoSrc: string;
  /**
   * Viewer-specific info for this post, if available from API.
   * Optional to maintain compatibility with older responses.
   */
  viewer?: {
    reaction?: ReactionKey | null;
    saved?: boolean | null;
  };
  /** Visibility scope for the post (e.g. Public, Friends). */
  visibility?: string;
  /** Whether the author allows comments on the post. */
  allowComments?: boolean;
  /** ISO timestamp for when the post was created. */
  createdAt?: string;
  /** ISO timestamp for the last update to the post. */
  updatedAt?: string;
  /** Organization IDs the post is shared with (if provided by API). */
  orgViewIds?: string[];
}
