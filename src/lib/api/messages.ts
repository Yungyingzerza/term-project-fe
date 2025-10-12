import type {
  ConversationItem,
  MessageItem,
  MessageUser,
} from "@/interfaces/messages";
import { buildApiUrl } from "./utils";

export interface RawUser {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  handle?: string;
  avatar?: string | null;
  picture_url?: string | null;
}

export interface RawMessage {
  _id?: string;
  id?: string;
  conversation_id?: string | RawConversationRef;
  conversationId?: string;
  sender_id?: string | RawUser;
  senderId?: string | RawUser;
  text?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface RawConversation {
  _id?: string;
  id?: string;
  name?: string | null;
  avatar?: string | null;
  participants?: Array<RawUser>;
  last_message_id?: RawMessage | null;
  lastMessage?: RawMessage | null;
  lastMessageId?: RawMessage | null;
  last_message_at?: string | null;
  lastMessageAt?: string | null;
  unread_count?: number;
  unreadCount?: number;
  last_read_at?: string | null;
  lastReadAt?: string | null;
}

export interface RawConversationRef {
  _id?: string;
  id?: string;
}

export interface ConversationsResponse {
  conversations: RawConversation[];
}

export interface MessagesResponse {
  messages: RawMessage[];
}

export interface CreateConversationParams {
  userIds: string[];
  signal?: AbortSignal;
  cookie?: string;
}

export interface CreateConversationResponse {
  conversation: RawConversation;
}

function normalizeId(
  input: string | RawConversationRef | RawUser | undefined | null
): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  const candidate = typeof input._id === "string" ? input._id : input.id;
  return typeof candidate === "string" ? candidate : "";
}

function normalizeUser(
  input: string | RawUser | undefined | null
): MessageUser {
  if (!input) {
    return { id: "", name: "", avatar: null };
  }
  if (typeof input === "string") {
    return { id: input, name: "", avatar: null };
  }
  const id = normalizeId(input);
  const nameCandidate =
    typeof input.name === "string"
      ? input.name
      : typeof input.username === "string"
      ? input.username
      : typeof input.handle === "string"
      ? input.handle
      : "";
  const avatar =
    typeof input.avatar === "string" ? input.avatar : input.picture_url ?? null;
  return { id, name: nameCandidate, avatar: avatar ?? null };
}

function normalizeTimestamp(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toMessageItem(
  raw: RawMessage,
  fallbackSender?: MessageUser
): MessageItem {
  const sender = normalizeUser(raw.sender_id ?? raw.senderId) ??
    fallbackSender ?? {
      id: "",
      name: "",
      avatar: null,
    };
  const conversationId =
    raw.conversationId ??
    normalizeId(raw.conversation_id as string | RawConversationRef | undefined);
  const createdAt =
    normalizeTimestamp(
      raw.created_at ?? raw.createdAt ?? raw.updated_at ?? raw.updatedAt
    ) ?? new Date().toISOString();
  return {
    id: raw._id ?? raw.id ?? `${conversationId}-${createdAt}`,
    conversationId,
    sender: sender.id
      ? sender
      : fallbackSender ?? { id: "", name: "", avatar: null },
    text: raw.text ?? "",
    createdAt,
  };
}

export function toConversationItem(raw: RawConversation): ConversationItem {
  const participants = (raw.participants ?? []).map((user) =>
    normalizeUser(user)
  );
  const lastMessageRaw =
    raw.last_message_id ?? raw.lastMessage ?? raw.lastMessageId ?? null;
  const lastMessage = lastMessageRaw ? toMessageItem(lastMessageRaw) : null;
  return {
    id: raw._id ?? raw.id ?? "",
    name: raw.name ?? null,
    avatar: raw.avatar ?? null,
    participants,
    lastMessage,
    lastMessageAt:
      lastMessage?.createdAt ??
      normalizeTimestamp(raw.last_message_at ?? raw.lastMessageAt) ??
      null,
    unreadCount:
      typeof raw.unread_count === "number"
        ? raw.unread_count
        : typeof raw.unreadCount === "number"
        ? raw.unreadCount
        : 0,
    lastReadAt: normalizeTimestamp(raw.last_read_at ?? raw.lastReadAt),
  };
}

export async function createConversation({
  userIds,
  signal,
  cookie,
}: CreateConversationParams): Promise<ConversationItem> {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error("userIds array is required");
  }

  const url = buildApiUrl("messages/conversations");
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    credentials: "include",
    cache: "no-store",
    signal,
    body: JSON.stringify({ user_ids: userIds }),
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to create conversation: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  const data = (await res.json()) as CreateConversationResponse;
  if (!data.conversation) {
    throw new Error("Response missing conversation detail");
  }

  return toConversationItem(data.conversation);
}

export async function fetchConversations({
  limit,
  before,
  signal,
  cookie,
}: {
  limit?: number;
  before?: string;
  signal?: AbortSignal;
  cookie?: string;
} = {}): Promise<ConversationItem[]> {
  const url = buildApiUrl("messages/conversations");
  if (typeof limit === "number") url.searchParams.set("limit", String(limit));
  if (before) url.searchParams.set("before", before);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    credentials: "include",
    cache: "no-store",
    signal,
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch conversations: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  const data = (await res.json()) as ConversationsResponse;
  return (data.conversations ?? []).map(toConversationItem);
}

export async function fetchMessages({
  conversationId,
  limit,
  before,
  signal,
  cookie,
}: {
  conversationId: string;
  limit?: number;
  before?: string;
  signal?: AbortSignal;
  cookie?: string;
}): Promise<MessageItem[]> {
  const url = buildApiUrl(
    `messages/conversations/${encodeURIComponent(conversationId)}/messages`
  );
  if (typeof limit === "number") url.searchParams.set("limit", String(limit));
  if (before) url.searchParams.set("before", before);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    credentials: "include",
    cache: "no-store",
    signal,
  } as RequestInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch messages: ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  const data = (await res.json()) as MessagesResponse;
  return (data.messages ?? []).map((message) => toMessageItem(message));
}
