export interface UserMeta {
  handle: string;
  name: string;
  avatar: string;
}

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

export type ReactionKey = "like" | "love" | "haha" | "sad" | "angry";

export type Interactions = Record<ReactionKey, number>;

export interface ActionRailProps {
  interactions: Interactions;
  comments: number;
  saves: number;
}

export interface MusicTickerProps {
  text: string;
}

export interface VideoCardProps {
  post: PostItem;
  isActive?: boolean;
}
