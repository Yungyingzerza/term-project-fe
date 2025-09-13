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
}
