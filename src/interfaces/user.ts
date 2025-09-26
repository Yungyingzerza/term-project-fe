export interface UserMeta {
  handle: string;
  name: string;
  avatar: string;
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
