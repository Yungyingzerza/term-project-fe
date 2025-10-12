export type ExploreSearchType = "all" | "users" | "organizations" | "posts";
export type ExploreSortOption =
  | "trending"
  | "most_viewed"
  | "most_reactions"
  | "latest";

export interface ExploreUserResult {
  type: "user";
  id: string;
  username: string;
  handle: string;
  pictureUrl: string;
}

export interface ExploreOrganizationResult {
  type: "organization";
  id: string;
  name: string;
  logoUrl: string;
  isWorkOrg: boolean;
}

export interface ExplorePostUser {
  id: string;
  username: string;
  handle: string;
  pictureUrl: string;
}

export interface ExplorePostResult {
  type: "post";
  id: string;
  user: ExplorePostUser;
  caption: string;
  thumbnail: string;
  videoSrc: string;
  tags: string[];
  interactions: {
    likes: number;
    loves: number;
    hahas: number;
    sads: number;
    angries: number;
  };
  comments: number;
  saves: number;
  views: number;
  createdAt: string;
}

export type ExploreResult =
  | ExploreUserResult
  | ExploreOrganizationResult
  | ExplorePostResult;

export interface ExploreResponse {
  results: ExploreResult[];
  nextCursor?: string;
  hasMore: boolean;
}
