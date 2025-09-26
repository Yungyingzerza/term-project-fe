import type { Organization } from "./organization";

export type UploadVisibility = "Public" | "Friends" | "Private" | "Organizations";

export interface UploadedPost {
  _id: string;
  user_id: string;
  caption: string;
  music: string;
  like_count: number;
  love_count: number;
  haha_count: number;
  sad_count: number;
  angry_count: number;
  comments_count: number;
  saves_count: number;
  tags: string[];
  video_src: string;
  visibility: UploadVisibility;
  allow_comments: boolean;
  created_at: string;
  updated_at: string;
  thumbnail?: string;
  orgs?: Organization[];
  __v?: number;
}

export interface UploadVideoResponse {
  postId: string;
  post: UploadedPost;
  orgViewIds: string[];
  tags: string[];
}
