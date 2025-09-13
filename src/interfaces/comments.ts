export type CommentVisibility = "Public" | "OwnerOnly";

export interface CommentUser {
  id: string;
  handle: string;
  name: string;
  avatar: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  text: string;
  visibility: CommentVisibility;
  parentCommentId: string | null;
  user: CommentUser;
  createdAt: string; // ISO timestamp
}

export interface CommentsPage {
  items: CommentItem[];
  paging: { hasMore: boolean; nextCursor: string | null };
}

