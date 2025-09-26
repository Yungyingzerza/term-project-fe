export interface UserMeta {
  handle: string;
  name: string;
  avatar: string;
}

export interface PostLiteUser {
  id: string;
  handle: string;
  name: string;
  avatar: string;
}

export interface PostLite {
  id: string;
  user: PostLiteUser;
  caption: string;
  music: string;
  interactions: Record<string, number>;
  comments: number;
  saves: number;
  thumbnail: string;
  tags: string[];
  videoSrc: string;
  visibility?: string;
  allowComments?: boolean;
  createdAt?: string;
  updatedAt?: string;
  viewer?: {
    reaction?: string | null;
    saved?: boolean;
  };
}

export interface UserHandleLookupResponse {
  userId: string;
}

export interface UserProfileUser {
  _id: string;
  username?: string;
  handle?: string;
  picture_url?: string;
  emails?: string[];
  bio?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfileResponse {
  user: UserProfileUser;
  follower_count: number;
  following_count: number;
  post_count: number;
  is_following: boolean | null;
}

export interface FollowUserPayload {
  targetUserId: string;
  action: "follow" | "unfollow";
}

export interface UserSavedVideoItem {
  postId: string;
  savedAt: string;
  post: PostLite;
}

export interface SavedVideosResponse {
  items: UserSavedVideoItem[];
  paging: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface UserReactedVideoItem {
  postId: string;
  reactionId: string;
  reactionKey: string;
  reactedAt: string;
  post: PostLite;
}

export interface UserReactionsResponse {
  items: UserReactedVideoItem[];
  paging: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}
