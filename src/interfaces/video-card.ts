import type { PostItem } from "./post";

export interface VideoCardProps {
  post: PostItem;
  isActive?: boolean;
  shouldPreload?: boolean;
  preloadSeconds?: number; // approximate warm buffer duration when preloading
  isDragging?: boolean; // hint to reduce effects during gestures
}
