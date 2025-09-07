import type { UserMeta } from "./user";
import type { Interactions } from "./reactions";

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
}

