"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  MessageCircle,
  MoreVertical,
  Phone,
  Search,
  Send,
  Video,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import { useAppSelector } from "@/store/hooks";
import { useApi } from "@/hooks/useApi";
import type {
  ConversationItem,
  MessageItem,
  MessageUser,
} from "@/interfaces/messages";
import {
  toConversationItem,
  toMessageItem,
  type RawConversation,
  type RawMessage,
} from "@/lib/api/messages";
import { buildApiUrlString } from "@/lib/api/utils";

interface ConversationView {
  conversation: ConversationItem;
  displayName: string;
  displayAvatar: string | null;
  lastTimeLabel: string;
  lastMessageText: string;
}

interface ConversationsPayload {
  conversations: RawConversation[];
}

interface MessagesPayload {
  messages: RawMessage[];
}

interface SendMessagePayload {
  message: RawMessage;
}

const DEFAULT_THEM_AVATAR = "https://i.pravatar.cc/100?img=3";

export default function MessagesPage() {
  const ambientColor = useAppSelector((s) => s.player.ambientColor);
  const user = useAppSelector((s) => s.user);
  const userId = user?.id || "";
  const { json } = useApi();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsSnapshot = useMemo(
    () => searchParams.toString(),
    [searchParams]
  );

  const currentUser = useMemo<MessageUser>(
    () => ({
      id: userId,
      name: user?.username || "คุณ",
      avatar: user?.picture_url || null,
    }),
    [user?.picture_url, user?.username, userId]
  );

  const defaultMeAvatar = useMemo(
    () => user?.picture_url || "https://i.pravatar.cc/100?img=2",
    [user?.picture_url]
  );

  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(
    null
  );
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, MessageItem[]>
  >({});
  const [messagesLoading, setMessagesLoading] = useState<
    Record<string, boolean>
  >({});
  const [messagesError, setMessagesError] = useState<
    Record<string, string | null>
  >({});
  const [sendErrors, setSendErrors] = useState<Record<string, string | null>>(
    {}
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string>("");
  const [desiredConversationId, setDesiredConversationId] = useState<string>(
    () => searchParams.get("conversationId") ?? ""
  );
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    setConversationsError(null);
    try {
      const data = await json<ConversationsPayload>("/messages/conversations");
      const mapped = (data.conversations ?? []).map((item) =>
        toConversationItem(item)
      );
      setConversations(mapped);
    } catch (error) {
      console.error("Failed to load conversations", error);
      setConversationsError("ไม่สามารถโหลดการสนทนาได้");
    } finally {
      setConversationsLoading(false);
    }
  }, [json]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;
      setMessagesLoading((prev) => ({ ...prev, [conversationId]: true }));
      setMessagesError((prev) => ({ ...prev, [conversationId]: null }));
      try {
        const data = await json<MessagesPayload>(
          `/messages/conversations/${encodeURIComponent(
            conversationId
          )}/messages`
        );
        const mapped = (data.messages ?? []).map((item) =>
          toMessageItem(item, currentUser)
        );
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: mapped,
        }));
      } catch (error) {
        console.error("Failed to load messages", error);
        setMessagesError((prev) => ({
          ...prev,
          [conversationId]: "ไม่สามารถโหลดข้อความได้",
        }));
      } finally {
        setMessagesLoading((prev) => ({ ...prev, [conversationId]: false }));
      }
    },
    [currentUser, json]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;
      try {
        await json(
          `/messages/conversations/${encodeURIComponent(conversationId)}/read`,
          {
            method: "POST",
          }
        );
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, unreadCount: 0, lastReadAt: new Date().toISOString() }
              : c
          )
        );
      } catch (error) {
        console.error("Failed to mark conversation as read", error);
      }
    },
    [json]
  );

  const conversationViews = useMemo<ConversationView[]>(
    () =>
      conversations.map((conversation) => {
        const { title, avatar } = describeConversation(
          conversation,
          currentUser.id
        );
        return {
          conversation,
          displayName: title,
          displayAvatar: avatar,
          lastTimeLabel: formatRelativeTime(conversation.lastMessageAt),
          lastMessageText: conversation.lastMessage?.text ?? "",
        };
      }),
    [conversations, currentUser.id]
  );

  const activeView = useMemo<ConversationView | null>(() => {
    if (!conversationViews.length) return null;
    const match = conversationViews.find(
      (view) => view.conversation.id === activeId
    );
    return match ?? conversationViews[0];
  }, [activeId, conversationViews]);

  const activeConversation = activeView?.conversation ?? null;
  const activeMessages = activeConversation
    ? messagesByConversation[activeConversation.id] ?? []
    : [];
  const activeDraft = activeConversation
    ? drafts[activeConversation.id] ?? ""
    : "";
  const activeSendError = activeConversation
    ? sendErrors[activeConversation.id] ?? null
    : null;
  const activeMessagesLoading = activeConversation
    ? !!messagesLoading[activeConversation.id]
    : false;
  const activeMessagesError = activeConversation
    ? messagesError[activeConversation.id] ?? null
    : null;

  // Scroll to bottom when messages change
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [activeMessages.length, activeConversation?.id]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsSnapshot);
    const queryId = params.get("conversationId") ?? "";
    setDesiredConversationId((prev) => (prev === queryId ? prev : queryId));
  }, [searchParamsSnapshot]);

  useEffect(() => {
    if (!conversationViews.length) {
      setActiveId("");
      return;
    }

    if (desiredConversationId) {
      const exists = conversationViews.some(
        (view) => view.conversation.id === desiredConversationId
      );
      if (exists && desiredConversationId !== activeId) {
        setActiveId(desiredConversationId);
      }
      return;
    }

    if (!activeId) {
      setActiveId(conversationViews[0].conversation.id);
      return;
    }

    const hasActive = conversationViews.some(
      (view) => view.conversation.id === activeId
    );
    if (!hasActive) {
      setActiveId(conversationViews[0].conversation.id);
    }
  }, [activeId, conversationViews, desiredConversationId]);

  useEffect(() => {
    if (!activeConversation) return;
    if (messagesByConversation[activeConversation.id]) return;
    if (messagesLoading[activeConversation.id]) return;
    void loadMessages(activeConversation.id);
  }, [
    activeConversation,
    loadMessages,
    messagesByConversation,
    messagesLoading,
  ]);

  useEffect(() => {
    if (!activeConversation) return;
    if (activeConversation.unreadCount <= 0) return;
    const loaded = messagesByConversation[activeConversation.id];
    if (!loaded || loaded.length === 0) return;
    void markAsRead(activeConversation.id);
  }, [activeConversation, markAsRead, messagesByConversation]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setActiveId(conversationId);
      setDesiredConversationId(conversationId);
      setShowChatOnMobile(true);

      const nextParams = new URLSearchParams(searchParamsSnapshot);
      if (conversationId) {
        nextParams.set("conversationId", conversationId);
      } else {
        nextParams.delete("conversationId");
      }
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });

      if (
        !messagesByConversation[conversationId] &&
        !messagesLoading[conversationId]
      ) {
        void loadMessages(conversationId);
      }
    },
    [
      loadMessages,
      messagesByConversation,
      messagesLoading,
      pathname,
      router,
      searchParamsSnapshot,
    ]
  );

  const handleDraftChange = useCallback(
    (conversationId: string, value: string) => {
      setDrafts((prev) => ({ ...prev, [conversationId]: value }));
    },
    []
  );

  const handleSend = useCallback(async () => {
    if (!activeConversation) return;
    const conversationId = activeConversation.id;
    const input = drafts[conversationId] ?? "";
    const text = input.trim();
    if (!text) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const sentAt = new Date().toISOString();
    const optimisticMessage: MessageItem = {
      id: optimisticId,
      conversationId,
      sender: currentUser,
      text,
      createdAt: sentAt,
      optimistic: true,
    };
    const existingMessages = messagesByConversation[conversationId] ?? [];
    const optimisticMessages = [...existingMessages, optimisticMessage];

    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: optimisticMessages,
    }));
    setDrafts((prev) => ({ ...prev, [conversationId]: "" }));
    setSendErrors((prev) => ({ ...prev, [conversationId]: null }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: optimisticMessage, lastMessageAt: sentAt }
          : c
      )
    );

    try {
      const data = await json<SendMessagePayload>(
        `/messages/conversations/${encodeURIComponent(
          conversationId
        )}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ text }),
        }
      );
      const serverMessage = toMessageItem(data.message, currentUser);
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).map((msg) =>
          msg.id === optimisticId ? serverMessage : msg
        ),
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: serverMessage,
                lastMessageAt: serverMessage.createdAt,
              }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to send message", error);
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: existingMessages,
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage:
                  existingMessages[existingMessages.length - 1] ?? null,
                lastMessageAt:
                  existingMessages.length > 0
                    ? existingMessages[existingMessages.length - 1].createdAt
                    : null,
              }
            : c
        )
      );
      setSendErrors((prev) => ({
        ...prev,
        [conversationId]: "ส่งข้อความไม่สำเร็จ",
      }));
      setDrafts((prev) => ({ ...prev, [conversationId]: text }));
      void loadConversations();
    }
  }, [
    activeConversation,
    currentUser,
    drafts,
    json,
    loadConversations,
    messagesByConversation,
  ]);

  const handleSseMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          conversation_id?: string;
          message_id?: string;
        };
        if (payload.type !== "new_message" || !payload.conversation_id) return;
        const conversationId = payload.conversation_id;
        void loadConversations();
        if (conversationId === activeConversation?.id) {
          void loadMessages(conversationId);
          void markAsRead(conversationId);
        }
      } catch (error) {
        console.error("Failed to handle SSE message", error);
      }
    },
    [activeConversation?.id, loadConversations, loadMessages, markAsRead]
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      let endpoint = "/messages/sse";
      try {
        endpoint = buildApiUrlString("messages/sse");
      } catch {
        // Fallback to relative path when base API is not configured.
      }

      const source = new EventSource(endpoint, { withCredentials: true });
      sseRef.current = source;
      source.onmessage = handleSseMessage;
      source.onerror = () => {
        source.close();
        if (cancelled) return;
        reconnectTimerRef.current = window.setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      sseRef.current?.close();
      sseRef.current = null;
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [handleSseMessage, userId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversationViews;
    return conversationViews.filter((view) =>
      view.displayName.toLowerCase().includes(q)
    );
  }, [conversationViews, query]);

  const activeAvatar = activeView?.displayAvatar || DEFAULT_THEM_AVATAR;

  return (
    <div className="flex flex-col relative min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black overscroll-none pt-14">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-[background-color,opacity] duration-700 ease-linear"
        style={{
          backgroundColor: ambientColor,
          opacity: 0.5,
          filter: "blur(60px)",
        }}
      />

      <TopBar />

      <div className="relative z-10 flex flex-1">
        <Sidebar />

        <main className="flex-1 pb-24 md:pb-6 md:ml-64 flex flex-col">
          <section className="w-full px-4 lg:px-6 py-6 flex-1 flex flex-col">
            <div
              className={`${
                showChatOnMobile ? "hidden lg:flex" : "flex"
              } items-center gap-2 mb-5 shrink-0`}
            >
              <div className="w-8 h-8 rounded-lg bg-white text-black grid place-items-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold">ข้อความ</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] gap-5 flex-1 min-h-0">
              <div
                className={`rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm overflow-hidden ${
                  showChatOnMobile ? "hidden lg:flex" : "flex"
                } flex-col`}
              >
                <div className="p-4 border-b border-white/10 shrink-0">
                  <div className="group relative">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="ค้นหาข้อความ"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-white/20"
                      aria-label="ค้นหาข้อความ"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto scroll-smoothbar">
                  {filtered.map((view) => {
                    const {
                      conversation,
                      displayName,
                      displayAvatar,
                      lastTimeLabel,
                      lastMessageText,
                    } = view;
                    const isActive = conversation.id === activeConversation?.id;
                    return (
                      <button
                        key={conversation.id}
                        onClick={() =>
                          handleSelectConversation(conversation.id)
                        }
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 ${
                          isActive ? "bg-white/10" : ""
                        }`}
                        aria-current={isActive || undefined}
                      >
                        <Image
                          src={displayAvatar || DEFAULT_THEM_AVATAR}
                          alt={`ภาพโปรไฟล์ของ ${displayName || "ผู้ใช้"}`}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full border border-white/10 object-cover"
                          unoptimized
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {displayName}
                            </p>
                            <span className="text-xs text-white/70 ml-2 shrink-0">
                              {lastTimeLabel}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 truncate">
                            {lastMessageText || "ยังไม่มีข้อความ"}
                          </p>
                        </div>
                        {conversation.unreadCount > 0 ? (
                          <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-semibold">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                  {filtered.length === 0 && !conversationsLoading && (
                    <div className="px-4 py-6 text-sm text-white/60">
                      ไม่พบการสนทนา
                    </div>
                  )}
                  {conversationsLoading && conversations.length === 0 && (
                    <div className="px-4 py-6 text-sm text-white/60">
                      กำลังโหลด...
                    </div>
                  )}
                  {conversationsError ? (
                    <div className="px-4 py-6 text-sm text-red-400">
                      {conversationsError}
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className={`rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm overflow-hidden ${
                  showChatOnMobile ? "flex" : "hidden lg:flex"
                } flex-col`}
              >
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 shrink-0">
                  <button
                    className="lg:hidden cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10"
                    onClick={() => setShowChatOnMobile(false)}
                    aria-label="กลับไปยังรายชื่อแชต"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <Image
                    src={activeAvatar}
                    alt={
                      activeView?.displayName
                        ? `ภาพโปรไฟล์ของ ${activeView.displayName}`
                        : "ภาพโปรไฟล์ผู้ติดต่อ"
                    }
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full border border-white/10 object-cover"
                    unoptimized
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {activeView?.displayName || "เลือกการสนทนา"}
                    </p>
                    <p className="text-xs text-white/70 truncate">
                      {activeConversation
                        ? "ออนไลน์อยู่ตอนนี้"
                        : "เลือกการสนทนาเพื่อเริ่ม"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={listRef}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scroll-smoothbar"
                >
                  {activeConversation ? (
                    <>
                      {activeMessages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          currentUser={currentUser}
                          fallbackMeAvatar={defaultMeAvatar}
                          fallbackThemAvatar={activeAvatar}
                        />
                      ))}
                      {activeMessages.length === 0 &&
                      !activeMessagesLoading &&
                      !activeMessagesError ? (
                        <div className="text-center text-white/60 text-sm py-12">
                          ทักทายเพื่อเริ่มการสนทนา
                        </div>
                      ) : null}
                      {activeMessagesLoading ? (
                        <div className="text-center text-white/60 text-sm py-6">
                          กำลังโหลดข้อความ...
                        </div>
                      ) : null}
                      {activeMessagesError ? (
                        <div className="text-center text-red-400 text-sm py-6">
                          {activeMessagesError}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="text-center text-white/60 text-sm py-12">
                      เลือกการสนทนาทางด้านซ้ายเพื่อเริ่มต้น
                    </div>
                  )}
                </div>

                <div className="px-3 py-3 border-t border-white/10 shrink-0">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <textarea
                        value={activeDraft}
                        onChange={(e) => {
                          if (!activeConversation) return;
                          handleDraftChange(
                            activeConversation.id,
                            e.target.value
                          );
                        }}
                        rows={1}
                        placeholder={
                          activeConversation
                            ? "เขียนข้อความ"
                            : "เลือกการสนทนาก่อน"
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleSend();
                          }
                        }}
                        disabled={!activeConversation}
                        className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/20 disabled:opacity-60"
                      />
                      <div className="mt-1 text-[11px] text-white/60">
                        กด Enter เพื่อส่ง • Shift+Enter เพื่อขึ้นบรรทัดใหม่
                      </div>
                      {activeSendError ? (
                        <div className="mt-1 text-xs text-red-400">
                          {activeSendError}
                        </div>
                      ) : null}
                    </div>
                    <button
                      onClick={() => void handleSend()}
                      disabled={!activeConversation || !activeDraft.trim()}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-black font-semibold disabled:opacity-50"
                      aria-label="ส่งข้อความ"
                    >
                      <Send className="w-4 h-4" />
                      ส่ง
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <div className="relative z-10">
        <BottomTabs />
      </div>
    </div>
  );
}

function describeConversation(
  conversation: ConversationItem,
  currentUserId: string
): {
  title: string;
  avatar: string | null;
} {
  if (conversation.name) {
    return { title: conversation.name, avatar: conversation.avatar }; // prefer explicit name when available
  }
  const others = conversation.participants.filter(
    (participant) => participant.id && participant.id !== currentUserId
  );
  if (others.length === 1) {
    const other = others[0];
    return {
      title: other.name || "ผู้ใช้ ModernTok",
      avatar: other.avatar ?? conversation.avatar,
    };
  }
  if (others.length > 1) {
    const names = others.map((participant) => participant.name).filter(Boolean);
    const title = names.length ? names.join(", ") : "กลุ่ม ModernTok";
    return {
      title,
      avatar: conversation.avatar ?? others[0].avatar ?? null,
    };
  }
  return {
    title: "การสนทนา",
    avatar: conversation.avatar,
  };
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return "ขณะนี้";
  if (diffMs < hour) return `${Math.round(diffMs / minute)} นาที`;
  if (diffMs < day) return `${Math.round(diffMs / hour)} ชม.`;
  if (diffMs < 7 * day) return `${Math.round(diffMs / day)} วัน`;
  return date.toLocaleDateString("th-TH", { month: "short", day: "numeric" });
}

function formatMessageTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageBubble({
  message,
  currentUser,
  fallbackMeAvatar,
  fallbackThemAvatar,
}: {
  message: MessageItem;
  currentUser: MessageUser;
  fallbackMeAvatar: string;
  fallbackThemAvatar: string;
}) {
  const isMe =
    message.sender.id && currentUser.id && message.sender.id === currentUser.id;
  const avatar = isMe
    ? currentUser.avatar ?? fallbackMeAvatar
    : message.sender.avatar ?? fallbackThemAvatar ?? DEFAULT_THEM_AVATAR;
  const timeLabel = formatMessageTime(message.createdAt);
  const showCheck = isMe && !message.optimistic;

  return (
    <div className={`flex items-end gap-2 ${isMe ? "justify-end" : ""}`}>
      {!isMe && (
        <Image
          src={avatar || DEFAULT_THEM_AVATAR}
          alt={
            message.sender.name
              ? `ภาพโปรไฟล์ของ ${message.sender.name}`
              : "ภาพโปรไฟล์คู่สนทนา"
          }
          width={28}
          height={28}
          className="w-7 h-7 rounded-full border border-white/10 object-cover"
          unoptimized
        />
      )}
      <div className={`max-w-[70%] ${isMe ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block px-3 py-2 rounded-2xl border text-sm leading-snug whitespace-pre-wrap ${
            isMe
              ? "bg-white text-black border-white rounded-br-md"
              : "bg-white/10 border-white/10 rounded-bl-md"
          }`}
        >
          {message.text}
        </div>
        <div
          className={`mt-0.5 flex items-center gap-1 ${
            isMe ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-[11px] text-white/70">{timeLabel}</span>
          {showCheck ? <Check className="w-3.5 h-3.5 text-white/70" /> : null}
        </div>
      </div>
      {isMe && (
        <Image
          src={avatar || fallbackMeAvatar}
          alt="ภาพโปรไฟล์ของคุณ"
          width={28}
          height={28}
          className="w-7 h-7 rounded-full border border-white/10 object-cover"
          unoptimized
        />
      )}
    </div>
  );
}
