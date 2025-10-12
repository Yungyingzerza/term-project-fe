"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import { useAppSelector } from "@/store/hooks";
import type { PostItem } from "@/interfaces/post";
import type {
  SavedVideosResponse,
  UserMeta,
  UserProfileResponse,
  UserReactionsResponse,
  ViewHistoryResponse,
} from "@/interfaces/user";
import {
  followUser,
  getUserReactions,
  getUserSavedVideos,
  getUserViewHistory,
} from "@/lib/api/user";
import { getFeedByUserHandle } from "@/lib/api/feed";
import {
  Eye,
  Play,
  Users,
  UserPlus,
  Clapperboard,
  Heart,
  Share2,
  Link2,
  Bookmark,
  History,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { createConversation } from "@/lib/api/messages";

type MiniPost = {
  id: string;
  thumbnail: string;
  videoSrc: string;
  views: number;
  duration?: string; // mm:ss
};

const REACTION_LABELS: Record<string, string> = {
  like: "ถูกใจ",
  love: "รักเลย",
  haha: "ขำดี",
  sad: "เศร้า",
  angry: "โกรธ",
};

interface ProfilePageProps {
  author?: UserMeta;
  items?: PostItem[];
  profile?: UserProfileResponse;
  reacted?: UserReactionsResponse;
  saved?: SavedVideosResponse;
  history?: ViewHistoryResponse;
  videoPaging?: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export default function ProfilePage({
  author,
  items,
  profile,
  reacted,
  saved,
  history,
  videoPaging,
}: ProfilePageProps) {
  const ambientColor = useAppSelector((s) => s.player.ambientColor);
  const user = useAppSelector((s) => s.user);
  const router = useRouter();
  const profileUser = profile?.user;
  const displayName =
    profileUser?.username || author?.name || user?.username || "ครีเอเตอร์";
  const rawHandle =
    profileUser?.handle || author?.handle || user?.username || "creator";
  const normalizedHandle = rawHandle?.startsWith("@")
    ? rawHandle.slice(1)
    : rawHandle;
  const avatar =
    profileUser?.picture_url ||
    author?.avatar ||
    user?.picture_url ||
    "https://i.pravatar.cc/100?img=1";
  const profileUserId = profileUser?._id ?? "";

  const [isFollowing, setIsFollowing] = useState<boolean>(
    Boolean(profile?.is_following)
  );
  const [followerCount, setFollowerCount] = useState<number>(
    profile?.follower_count ?? 0
  );
  const [followingCount, setFollowingCount] = useState<number>(
    profile?.following_count ?? 0
  );
  const postCount =
    profile?.post_count ?? (Array.isArray(items) ? items.length : 0);
  const [followError, setFollowError] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    "videos" | "reactions" | "saves" | "history"
  >("videos");

  // Pagination states for videos
  const [videoItems, setVideoItems] = useState<PostItem[]>(items ?? []);
  const [messageBusy, setMessageBusy] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [videoCursor, setVideoCursor] = useState(
    videoPaging?.nextCursor ?? null
  );
  const [videoHasMore, setVideoHasMore] = useState(
    videoPaging?.hasMore ?? false
  );
  const [videoLoading, setVideoLoading] = useState(false);

  // Pagination states for reactions, saves, history
  const [reactedItems, setReactedItems] = useState(reacted?.items ?? []);
  const [reactedCursor, setReactedCursor] = useState(
    reacted?.paging?.nextCursor ?? null
  );
  const [reactedHasMore, setReactedHasMore] = useState(
    reacted?.paging?.hasMore ?? false
  );
  const [reactedLoading, setReactedLoading] = useState(false);

  const [savedItems, setSavedItems] = useState(saved?.items ?? []);
  const [savedCursor, setSavedCursor] = useState(
    saved?.paging?.nextCursor ?? null
  );
  const [savedHasMore, setSavedHasMore] = useState(
    saved?.paging?.hasMore ?? false
  );
  const [savedLoading, setSavedLoading] = useState(false);

  const [historyItems, setHistoryItems] = useState(history?.items ?? []);
  const [historyCursor, setHistoryCursor] = useState(
    history?.paging?.nextCursor ?? null
  );
  const [historyHasMore, setHistoryHasMore] = useState(
    history?.paging?.hasMore ?? false
  );
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(Boolean(profile?.is_following));
    setFollowerCount(profile?.follower_count ?? 0);
    setFollowingCount(profile?.following_count ?? 0);
  }, [
    profile?.follower_count,
    profile?.following_count,
    profile?.is_following,
  ]);

  const formatCount = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  const isSelfProfile = useMemo(() => {
    if (!profileUser?._id || !user?.id) return false;
    return profileUser._id === user.id;
  }, [profileUser?._id, user?.id]);

  const handleStartConversation = useCallback(async () => {
    if (!profileUserId) return;
    try {
      setMessageBusy(true);
      setMessageError(null);
      const conversation = await createConversation({
        userIds: [profileUserId],
      });
      if (!conversation.id) {
        throw new Error("Missing conversation identifier");
      }
      router.push(`/messages?conversationId=${conversation.id}`);
    } catch (error) {
      console.error("Failed to start conversation", error);
      setMessageError("ไม่สามารถเริ่มการสนทนาได้");
    } finally {
      setMessageBusy(false);
    }
  }, [profileUserId, router]);

  const handleFollowClick = useCallback(async () => {
    if (!profileUser?._id) return;
    try {
      setFollowBusy(true);
      setFollowError(null);
      const action = isFollowing ? "unfollow" : "follow";
      await followUser({
        targetUserId: profileUser._id,
        action,
      });
      setIsFollowing(action === "follow");
      setFollowerCount((prev) =>
        Math.max(0, prev + (action === "follow" ? 1 : -1))
      );
    } catch (error: unknown) {
      setFollowError(
        error instanceof Error
          ? error.message
          : "ไม่สามารถอัปเดตสถานะการติดตามได้"
      );
    } finally {
      setFollowBusy(false);
    }
  }, [isFollowing, profileUser?._id]);

  const loadMoreVideos = useCallback(async () => {
    if (!videoCursor || videoLoading || !normalizedHandle) return;
    try {
      setVideoLoading(true);
      const data = await getFeedByUserHandle({
        handle: normalizedHandle,
        limit: 12,
        cursor: videoCursor,
      });
      setVideoItems((prev) => [...prev, ...(data.items ?? [])]);
      setVideoCursor(data.paging?.nextCursor ?? null);
      setVideoHasMore(data.paging?.hasMore ?? false);
    } catch (error) {
      console.error("Failed to load more videos:", error);
    } finally {
      setVideoLoading(false);
    }
  }, [videoCursor, videoLoading, normalizedHandle]);

  const loadMoreReactions = useCallback(async () => {
    if (!reactedCursor || reactedLoading) return;
    try {
      setReactedLoading(true);
      const data = await getUserReactions({ limit: 12, cursor: reactedCursor });
      setReactedItems((prev) => [...prev, ...(data.items ?? [])]);
      setReactedCursor(data.paging?.nextCursor ?? null);
      setReactedHasMore(data.paging?.hasMore ?? false);
    } catch (error) {
      console.error("Failed to load more reactions:", error);
    } finally {
      setReactedLoading(false);
    }
  }, [reactedCursor, reactedLoading]);

  const loadMoreSaves = useCallback(async () => {
    if (!savedCursor || savedLoading) return;
    try {
      setSavedLoading(true);
      const data = await getUserSavedVideos({ limit: 12, cursor: savedCursor });
      setSavedItems((prev) => [...prev, ...(data.items ?? [])]);
      setSavedCursor(data.paging?.nextCursor ?? null);
      setSavedHasMore(data.paging?.hasMore ?? false);
    } catch (error) {
      console.error("Failed to load more saves:", error);
    } finally {
      setSavedLoading(false);
    }
  }, [savedCursor, savedLoading]);

  const loadMoreHistory = useCallback(async () => {
    if (!historyCursor || historyLoading) return;
    try {
      setHistoryLoading(true);
      const data = await getUserViewHistory({
        limit: 12,
        cursor: historyCursor,
      });
      setHistoryItems((prev) => [...prev, ...(data.items ?? [])]);
      setHistoryCursor(data.paging?.nextCursor ?? null);
      setHistoryHasMore(data.paging?.hasMore ?? false);
    } catch (error) {
      console.error("Failed to load more history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyCursor, historyLoading]);

  // Infinite scroll effect - monitors window scroll
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Get scroll metrics from window
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;

        // Distance from bottom
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

        // Debug logging
        if (distanceFromBottom < 500) {
          console.log("Near bottom! Active tab:", activeTab, {
            distanceFromBottom,
            videoHasMore,
            videoLoading,
            videoCursor,
            reactedHasMore,
            reactedLoading,
            reactedCursor,
            savedHasMore,
            savedLoading,
            savedCursor,
            historyHasMore,
            historyLoading,
            historyCursor,
          });
        }

        // Trigger when within 500px of bottom
        if (distanceFromBottom < 500) {
          switch (activeTab) {
            case "videos":
              if (videoHasMore && !videoLoading && videoCursor) {
                console.log("Loading more videos...");
                loadMoreVideos();
              }
              break;
            case "reactions":
              if (reactedHasMore && !reactedLoading && reactedCursor) {
                console.log("Loading more reactions...");
                loadMoreReactions();
              }
              break;
            case "saves":
              if (savedHasMore && !savedLoading && savedCursor) {
                console.log("Loading more saves...");
                loadMoreSaves();
              }
              break;
            case "history":
              if (historyHasMore && !historyLoading && historyCursor) {
                console.log("Loading more history...");
                loadMoreHistory();
              }
              break;
          }
        }
      }, 100); // Debounce for 100ms
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [
    activeTab,
    videoHasMore,
    videoLoading,
    videoCursor,
    reactedHasMore,
    reactedLoading,
    reactedCursor,
    savedHasMore,
    savedLoading,
    savedCursor,
    historyHasMore,
    historyLoading,
    historyCursor,
    loadMoreVideos,
    loadMoreReactions,
    loadMoreSaves,
    loadMoreHistory,
  ]);

  const toMini = (p: PostItem): MiniPost => {
    return {
      id: p.id,
      thumbnail: p.thumbnail,
      videoSrc: p.videoSrc,
      views: p.views || 0,
    };
  };

  const gridItems = videoItems.map(toMini);
  const hasReactions = reactedItems.length > 0;
  const hasSaves = savedItems.length > 0;
  const hasHistory = historyItems.length > 0;
  const visibleTabs = useMemo(() => {
    const tabs: Array<{
      key: "videos" | "reactions" | "saves" | "history";
      label: string;
      icon: typeof Clapperboard;
    }> = [{ key: "videos", label: "วิดีโอ", icon: Clapperboard }];
    // Only show reactions, saves, and history tabs on user's own profile
    if (isSelfProfile) {
      if (hasReactions)
        tabs.push({ key: "reactions", label: "ที่ถูกใจ", icon: Heart });
      if (hasSaves)
        tabs.push({ key: "saves", label: "ที่บันทึกไว้", icon: Bookmark });
      if (hasHistory)
        tabs.push({ key: "history", label: "ประวัติการดู", icon: History });
    }
    return tabs;
  }, [hasReactions, hasSaves, hasHistory, isSelfProfile]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key ?? "videos");
    }
  }, [activeTab, visibleTabs]);

  // Scroll to top when switching tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderVideos = () => {
    if (videoItems.length === 0) {
      return (
        <div className="mt-6 text-center text-white/70">ยังไม่มีโพสต์</div>
      );
    }
    return (
      <>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full">
          {gridItems.map((p) => (
            <Link
              key={p.id}
              href={`/feed/${p.id}`}
              prefetch={false}
              className="group relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900/60 focus:outline-none focus:ring-2 focus:ring-white/20 w-full"
              aria-label={`เปิดวิดีโอ ${p.id} มียอดรับชม ${formatCount(
                p.views
              )} ครั้ง`}
            >
              <Image
                src={p.thumbnail}
                alt={`ภาพหน้าปกวิดีโอของ ${displayName}`}
                width={400}
                height={533}
                className="w-full aspect-[9/12] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                unoptimized
              />
              <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-black/60 border border-white/10 text-[11px] flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{formatCount(p.views)}</span>
              </div>
              {p.duration ? (
                <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/70 text-[11px] border border-white/10">
                  {p.duration}
                </div>
              ) : null}
              <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="h-12 w-12 rounded-full bg-black/50 border border-white/10 grid place-items-center">
                  <Play className="w-5 h-5" />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100" />
            </Link>
          ))}
        </div>
        {videoHasMore && (
          <div className="mt-6 flex justify-center">
            {videoLoading ? (
              <div className="flex items-center gap-2 text-white/60">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังโหลดเพิ่มเติม...</span>
              </div>
            ) : (
              <button
                onClick={loadMoreVideos}
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition flex items-center gap-2 text-sm"
              >
                โหลดเพิ่มเติม
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  const renderReactions = () => {
    if (!hasReactions) {
      return (
        <div className="mt-6 text-center text-white/70">
          ยังไม่มีวิดีโอที่คุณแสดงปฏิกิริยา
        </div>
      );
    }
    return (
      <>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
          {reactedItems.map((item) => (
            <MiniHorizontalCard
              key={item.reactionId}
              title={item.post.caption || "ไม่มีชื่อ"}
              thumb={item.post.thumbnail}
              meta={`${
                REACTION_LABELS[item.reactionKey] ??
                item.reactionKey.toUpperCase()
              } • ${formatDate(item.reactedAt)}`}
              href={`/feed/${item.post.id}`}
            />
          ))}
        </div>
        {reactedHasMore && (
          <div className="mt-6 flex justify-center">
            {reactedLoading ? (
              <div className="flex items-center gap-2 text-white/60">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังโหลดเพิ่มเติม...</span>
              </div>
            ) : (
              <button
                onClick={loadMoreReactions}
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition flex items-center gap-2 text-sm"
              >
                โหลดเพิ่มเติม
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  const renderSaves = () => {
    if (!hasSaves) {
      return (
        <div className="mt-6 text-center text-white/70">
          ยังไม่มีวิดีโอที่คุณบันทึกไว้
        </div>
      );
    }
    return (
      <>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
          {savedItems.map((item) => (
            <MiniHorizontalCard
              key={item.postId}
              title={item.post.caption || "ไม่มีชื่อ"}
              thumb={item.post.thumbnail}
              meta={`บันทึกเมื่อ ${formatDate(item.savedAt)}`}
              href={`/feed/${item.post.id}`}
            />
          ))}
        </div>
        {savedHasMore && (
          <div className="mt-6 flex justify-center">
            {savedLoading ? (
              <div className="flex items-center gap-2 text-white/60">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังโหลดเพิ่มเติม...</span>
              </div>
            ) : (
              <button
                onClick={loadMoreSaves}
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition flex items-center gap-2 text-sm"
              >
                โหลดเพิ่มเติม
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  const renderHistory = () => {
    if (!hasHistory) {
      return (
        <div className="mt-6 text-center text-white/70">
          ยังไม่มีประวัติการดูวิดีโอ
        </div>
      );
    }
    return (
      <>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
          {historyItems.map((item) => (
            <MiniHorizontalCard
              key={item.viewId}
              title={item.post.caption || "ไม่มีชื่อ"}
              thumb={item.post.thumbnail}
              meta={`ดูล่าสุดเมื่อ ${formatDate(item.viewedAt)}`}
              href={`/feed/${item.post.id}`}
            />
          ))}
        </div>
        {historyHasMore && (
          <div className="mt-6 flex justify-center">
            {historyLoading ? (
              <div className="flex items-center gap-2 text-white/60">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังโหลดเพิ่มเติม...</span>
              </div>
            ) : (
              <button
                onClick={loadMoreHistory}
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition flex items-center gap-2 text-sm"
              >
                โหลดเพิ่มเติม
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case "reactions":
        return renderReactions();
      case "saves":
        return renderSaves();
      case "history":
        return renderHistory();
      default:
        return renderVideos();
    }
  };

  return (
    <div className="flex flex-col relative min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black overscroll-none pt-14 overflow-x-hidden">
      {/* Ambient overlay to match ModernTok */}
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

      <div className="relative z-10 flex flex-1 overflow-x-hidden">
        <Sidebar />

        <main className="flex-1 pb-24 md:pb-6 md:ml-64 w-full overflow-x-hidden">
          <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6 w-full">
            {/* Header card - simplified to match ModernTok */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm p-4 sm:p-6 w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                <Image
                  src={avatar}
                  alt={`ภาพโปรไฟล์ของ ${displayName}`}
                  width={96}
                  height={96}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-white/10 object-cover flex-shrink-0"
                  unoptimized
                />
                <div className="flex-1 min-w-0 w-full">
                  <h1 className="text-xl sm:text-2xl font-extrabold leading-tight break-words">
                    {displayName}
                  </h1>
                  <p className="text-white/70 text-sm sm:text-base break-all">
                    @{normalizedHandle}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/80">
                    <span className="px-2 sm:px-3 py-1 rounded-full bg-white/10 border border-white/10 inline-flex items-center gap-1.5 whitespace-nowrap">
                      <Users className="w-3 sm:w-3.5 h-3 sm:h-3.5" />{" "}
                      {formatCount(followerCount)} ผู้ติดตาม
                    </span>
                    <span className="px-2 sm:px-3 py-1 rounded-full bg-white/10 border border-white/10 inline-flex items-center gap-1.5 whitespace-nowrap">
                      <UserPlus className="w-3 sm:w-3.5 h-3 sm:h-3.5" />{" "}
                      {formatCount(followingCount)} กำลังติดตาม
                    </span>
                    <span className="px-2 sm:px-3 py-1 rounded-full bg-white/10 border border-white/10 inline-flex items-center gap-1.5 whitespace-nowrap">
                      <Clapperboard className="w-3 sm:w-3.5 h-3 sm:h-3.5" />{" "}
                      {formatCount(postCount)} โพสต์
                    </span>
                  </div>
                  {profileUser?.website ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/70 overflow-hidden">
                      <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <a
                        href={profileUser.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-white/30 underline-offset-4 hover:text-white truncate"
                      >
                        {profileUser.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  ) : null}
                  {profileUser?.bio ? (
                    <p className="mt-2 text-sm text-white/70 leading-snug max-w-xl whitespace-pre-line break-words">
                      {profileUser.bio}
                    </p>
                  ) : null}
                </div>
                {!isSelfProfile ? (
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <button
                      disabled={messageBusy || !profileUserId}
                      onClick={handleStartConversation}
                      className={`px-3 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 transition bg-white/10 border border-white/10 hover:bg-white/15 text-sm whitespace-nowrap ${
                        messageBusy
                          ? "opacity-70 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      {messageBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      ส่งข้อความ
                    </button>
                    <button
                      disabled={followBusy || !profileUser?._id}
                      onClick={handleFollowClick}
                      className={`px-3 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 transition text-sm whitespace-nowrap ${
                        isFollowing
                          ? "bg-white/10 border border-white/10 text-white hover:bg-white/15"
                          : "bg-white text-black hover:opacity-90"
                      } ${
                        followBusy
                          ? "opacity-70 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />{" "}
                      {isFollowing ? "กำลังติดตาม" : "ติดตาม"}
                    </button>
                    <button className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
                      <Share2 className="w-4 h-4" /> แชร์
                    </button>
                  </div>
                ) : null}
              </div>
              {!isSelfProfile ? (
                <div className="mt-4 flex w-full gap-2 sm:hidden">
                  <button
                    disabled={followBusy || !profileUser?._id}
                    onClick={handleFollowClick}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition whitespace-nowrap ${
                      isFollowing
                        ? "bg-white/10 border border-white/10 text-white hover:bg-white/15"
                        : "bg-white text-black hover:opacity-90"
                    } ${
                      followBusy
                        ? "opacity-70 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {isFollowing ? "กำลังติดตาม" : "ติดตาม"}
                  </button>
                  <button
                    disabled={messageBusy || !profileUserId}
                    onClick={handleStartConversation}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold bg-white/10 border border-white/10 text-white/90 transition ${
                      messageBusy
                        ? "opacity-70 cursor-not-allowed"
                        : "cursor-pointer hover:bg-white/15"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 justify-center">
                      {messageBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      ส่งข้อความ
                    </span>
                  </button>
                  <button className="rounded-xl px-3 py-2 text-sm font-medium bg-white/10 border border-white/10 text-white/90 hover:bg-white/15 whitespace-nowrap">
                    แชร์
                  </button>
                </div>
              ) : null}
              {followError ? (
                <p className="mt-3 text-xs text-rose-400">{followError}</p>
              ) : null}
              {messageError ? (
                <p className="mt-1 text-xs text-rose-400">{messageError}</p>
              ) : null}

              {/* Tabs */}
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 text-sm">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`cursor-pointer px-3 py-1.5 rounded-lg border border-white/10 inline-flex items-center gap-1.5 transition ${
                        isActive
                          ? "bg-white text-black font-semibold"
                          : "bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {renderActiveContent()}
          </section>
        </main>
      </div>

      <div className="relative z-10">
        <BottomTabs />
      </div>
    </div>
  );
}

interface MiniHorizontalCardProps {
  title: string;
  thumb: string;
  meta: string;
  href: string;
}

function MiniHorizontalCard({
  title,
  thumb,
  meta,
  href,
}: MiniHorizontalCardProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/70 p-3 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 w-full overflow-hidden"
    >
      <Image
        src={thumb || "https://via.placeholder.com/80x120?text=No+Image"}
        alt={title}
        width={80}
        height={120}
        className="h-20 w-16 rounded-lg object-cover flex-shrink-0"
        unoptimized
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-sm font-semibold line-clamp-2 break-words">
          {title}
        </p>
        <p className="mt-1 text-xs text-white/60 truncate">{meta}</p>
      </div>
    </Link>
  );
}
