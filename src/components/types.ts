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
  likes: number;
  comments: number;
  saves: number;
  thumbnail: string;
  tags: string[];
  videoSrc: string;
}

export interface ActionRailProps {
  likes: number;
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
