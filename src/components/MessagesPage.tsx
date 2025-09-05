"use client";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import { useSelector } from "react-redux";
import {
  MessageCircle,
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Check,
  ArrowLeft,
} from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastTime: string; // e.g. "2m", "1h"
  unread?: number;
};

type Message = {
  id: string;
  author: "me" | "them";
  text: string;
  time: string; // HH:MM
  read?: boolean;
};

function nowTime() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function MessagesPage() {
  const ambientColor = useSelector((s: any) => s.player.ambientColor) as string;
  const user = useSelector((s: any) => s.user) as {
    username?: string;
    picture_url?: string;
  };

  const DEFAULT_ME = useMemo(
    () => ({
      name: user?.username || "You",
      avatar: user?.picture_url || "https://i.pravatar.cc/100?img=2",
    }),
    [user?.username, user?.picture_url]
  );

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState("c1");
  const [convos, setConvos] = useState<Conversation[]>([
    {
      id: "c1",
      name: "Ava",
      avatar: "https://i.pravatar.cc/100?img=1",
      lastMessage: "That cut was so clean!",
      lastTime: "2m",
      unread: 2,
    },
    {
      id: "c2",
      name: "Noah",
      avatar: "https://i.pravatar.cc/100?img=5",
      lastMessage: "Going live in 10",
      lastTime: "1h",
    },
    {
      id: "c3",
      name: "Mia",
      avatar: "https://i.pravatar.cc/100?img=8",
      lastMessage: "Send the raw clip?",
      lastTime: "yesterday",
    },
  ]);

  const [messagesByConvo, setMessagesByConvo] = useState<
    Record<string, Message[]>
  >({
    c1: [
      {
        id: "m1",
        author: "them",
        text: "That cut was so clean!",
        time: "09:41",
      },
      {
        id: "m2",
        author: "me",
        text: "Thanks! Tried a new grade.",
        time: "09:42",
        read: true,
      },
    ],
    c2: [{ id: "m3", author: "them", text: "Going live in 10", time: "08:10" }],
    c3: [
      {
        id: "m4",
        author: "them",
        text: "Send the raw clip?",
        time: "yesterday",
      },
      {
        id: "m5",
        author: "me",
        text: "Uploading now.",
        time: "yesterday",
        read: true,
      },
    ],
  });

  const listRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState("");
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  useEffect(() => {
    // Scroll to bottom when active convo changes or messages update
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [activeId, messagesByConvo[activeId]?.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return convos;
    return convos.filter((c) => c.name.toLowerCase().includes(q));
  }, [convos, query]);

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    const id = Math.random().toString(36).slice(2);
    setMessagesByConvo((prev) => ({
      ...prev,
      [activeId]: [
        ...(prev[activeId] || []),
        { id, author: "me", text, time: nowTime(), read: false },
      ],
    }));
    setDraft("");

    // Update convo preview
    setConvos((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, lastMessage: text, lastTime: "now" } : c
      )
    );
  };

  const active = convos.find((c) => c.id === activeId) || convos[0];
  const messages = messagesByConvo[active?.id] || [];

  return (
    <div className="flex flex-col relative min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black overflow-hidden overscroll-none pt-14">
      {/* Ambient overlay to match ModernTok */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-[background-color,opacity] duration-700 ease-linear"
        style={{
          backgroundColor: ambientColor,
          opacity: 0.5,
          filter: "blur(60px)",
        }}
      />

      <TopBar />

      <div className="relative z-10 flex flex-1">
        <Sidebar />

        <main className="flex-1">
          <section className="px-4 py-6 h-[calc(100vh-56px-var(--bottom-tabs-h,0px))] flex flex-col">
            {/* Header */}
            <div className={`${showChatOnMobile ? "hidden lg:flex" : "flex"} items-center gap-2 mb-5 shrink-0`}>
              <div className="w-8 h-8 rounded-lg bg-white text-black grid place-items-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold">Messages</h1>
            </div>

            {/* Content: Conversations list + Chat panel */}
            <div className="min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 flex-1 overflow-hidden">
              {/* Conversations */}
              <div
                className={`rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm h-full overflow-hidden ${
                  showChatOnMobile ? "hidden lg:flex" : "flex"
                } flex-col`}
              >
                <div className="p-4 border-b border-white/10 shrink-0">
                  <div className="group relative">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search messages"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-white/20"
                      aria-label="Search messages"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto scroll-smoothbar">
                  {filtered.map((c) => {
                    const active = c.id === activeId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveId(c.id);
                          setShowChatOnMobile(true);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 ${
                          active ? "bg-white/10" : ""
                        }`}
                        aria-current={active || undefined}
                      >
                        <img
                          src={c.avatar}
                          alt="avatar"
                          className="w-9 h-9 rounded-full border border-white/10 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{c.name}</p>
                            <span className="text-xs text-white/70 ml-2 shrink-0">
                              {c.lastTime}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 truncate">
                            {c.lastMessage}
                          </p>
                        </div>
                        {c.unread ? (
                          <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-semibold">
                            {c.unread}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="px-4 py-6 text-sm text-white/60">
                      No conversations found.
                    </div>
                  )}
                </div>
              </div>

              {/* Chat panel */}
              <div
                className={`rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm h-full min-h-0 overflow-hidden ${
                  showChatOnMobile ? "flex" : "hidden lg:flex"
                } flex-col`}
              >
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 shrink-0">
                  {/* Back (mobile) */}
                  <button
                    className="lg:hidden cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10"
                    onClick={() => setShowChatOnMobile(false)}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <img
                    src={active?.avatar}
                    alt="avatar"
                    className="w-9 h-9 rounded-full border border-white/10 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{active?.name}</p>
                    <p className="text-xs text-white/70 truncate">Active now</p>
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

                {/* Messages list */}
                <div
                  ref={listRef}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scroll-smoothbar"
                >
                  {messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      meAvatar={DEFAULT_ME.avatar}
                      themAvatar={active?.avatar || ""}
                    />
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center text-white/60 text-sm py-12">
                      Say hi to start the conversation.
                    </div>
                  )}
                </div>

                {/* Composer */}
                <div className="px-3 py-3 border-t border-white/10 shrink-0">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={1}
                        placeholder="Write a message"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                          }
                        }}
                        className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/20"
                      />
                      <div className="mt-1 text-[11px] text-white/60">
                        Press Enter to send • Shift+Enter for newline
                      </div>
                    </div>
                    <button
                      onClick={onSend}
                      disabled={!draft.trim()}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-black font-semibold disabled:opacity-50"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                      Send
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

function MessageBubble({
  message,
  meAvatar,
  themAvatar,
}: {
  message: Message;
  meAvatar: string;
  themAvatar: string;
}) {
  const isMe = message.author === "me";
  return (
    <div className={`flex items-end gap-2 ${isMe ? "justify-end" : ""}`}>
      {!isMe && (
        <img
          src={themAvatar}
          alt="avatar"
          className="w-7 h-7 rounded-full border border-white/10 object-cover"
        />
      )}
      <div className={`max-w-[70%] ${isMe ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block px-3 py-2 rounded-2xl border text-sm leading-snug ${
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
          <span className="text-[11px] text-white/70">{message.time}</span>
          {isMe && message.read ? (
            <Check className="w-3.5 h-3.5 text-white/70" />
          ) : null}
        </div>
      </div>
      {isMe && (
        <img
          src={meAvatar}
          alt="me"
          className="w-7 h-7 rounded-full border border-white/10 object-cover"
        />
      )}
    </div>
  );
}
