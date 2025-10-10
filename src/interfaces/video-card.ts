import type { PostItem } from "./post";

export interface VideoWatchCompletePayload {
  postId: string;
  watchTimeSeconds: number;
}

export interface VideoCardProps {
  post: PostItem;
  isActive?: boolean;
  shouldPreload?: boolean;
  preloadSeconds?: number; // approximate warm buffer duration when preloading
  onWatchComplete?: (payload: VideoWatchCompletePayload) => void;
}
