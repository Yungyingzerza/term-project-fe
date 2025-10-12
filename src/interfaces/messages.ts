export interface MessageUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  sender: MessageUser;
  text: string;
  createdAt: string;
  optimistic?: boolean;
}

export interface ConversationItem {
  id: string;
  name: string | null;
  avatar: string | null;
  participants: MessageUser[];
  lastMessage: MessageItem | null;
  lastMessageAt: string | null;
  unreadCount: number;
  lastReadAt: string | null;
}
