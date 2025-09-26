"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import { useSelector } from "react-redux";
import type { PostItem } from "@/interfaces/post";
import type {
  SavedVideosResponse,
  UserMeta,
  UserProfileResponse,
  UserReactionsResponse,
} from "@/interfaces/user";
import { followUser } from "@/lib/api/user";
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
} from "lucide-react";

type MiniPost = {
  id: string;
  thumbnail: string;
  videoSrc: string;
  views: number;
  duration?: string; // mm:ss
};

interface ProfilePageProps {
  author?: UserMeta;
  items?: PostItem[];
  profile?: UserProfileResponse;
  reacted?: UserReactionsResponse;
  saved?: SavedVideosResponse;
}

export default function ProfilePage({
  author,
  items,
  profile,
  reacted,
  saved,
}: ProfilePageProps) {
  const ambientColor = useSelector((s: any) => s.player.ambientColor) as string;
  const user = useSelector((s: any) => s.user) as {
    id?: string;
    username: string;
    picture_url: string;
  };
  const profileUser = profile?.user;
  const displayName =
    profileUser?.username || author?.name || user?.username || "Creator";
  const rawHandle =
    profileUser?.handle || author?.handle || user?.username || "creator";
  const normalizedHandle = rawHandle?.startsWith("@")
    ? rawHandle.slice(1)
    : rawHandle;
  const avatar =
    profileUser?.picture_url || author?.avatar || user?.picture_url || "https://i.pravatar.cc/100?img=1";

  const [isFollowing, setIsFollowing] = useState<boolean>(
    Boolean(profile?.is_following)
  );
  const [followerCount, setFollowerCount] = useState<number>(
    profile?.follower_count ?? 0
  );
  const [followingCount, setFollowingCount] = useState<number>(
    profile?.following_count ?? 0
  );
  const postCount = profile?.post_count ?? (Array.isArray(items) ? items.length : 0);
  const [followError, setFollowError] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"videos" | "reactions" | "saves">(
    "videos"
  );

  useEffect(() => {
    setIsFollowing(Boolean(profile?.is_following));
    setFollowerCount(profile?.follower_count ?? 0);
    setFollowingCount(profile?.following_count ?? 0);
  }, [profile?.follower_count, profile?.following_count, profile?.is_following]);

  const formatCount = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  const isSelfProfile = useMemo(() => {
    if (!profileUser?._id || !user?.id) return false;
    return profileUser._id === user.id;
  }, [profileUser?._id, user?.id]);

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
      setFollowerCount((prev) => Math.max(0, prev + (action === "follow" ? 1 : -1)));
    } catch (error: unknown) {
      setFollowError(
        error instanceof Error ? error.message : "Unable to update follow state"
      );
    } finally {
      setFollowBusy(false);
    }
  }, [isFollowing, profileUser?._id]);

  const toMini = (p: PostItem): MiniPost => {
    const sum = (Object.values(p?.interactions || {}) as number[]).reduce(
      (a, b) => a + (typeof b === "number" ? b : 0),
      0
    );
    return {
      id: p.id,
      thumbnail: p.thumbnail,
      videoSrc: p.videoSrc,
      views: sum,
    };
  };

  const hasRealItems = Array.isArray(items) && items.length > 0;
  const gridItems = hasRealItems ? (items as PostItem[]).map(toMini) : [];
  const reactedItems = reacted?.items ?? [];
  const savedItems = saved?.items ?? [];
  const hasReactions = reactedItems.length > 0;
  const hasSaves = savedItems.length > 0;
  const visibleTabs = useMemo(() => {
    const tabs: Array<{
      key: "videos" | "reactions" | "saves";
      label: string;
      icon: typeof Clapperboard;
    }> = [
      { key: "videos", label: "Videos", icon: Clapperboard },
    ];
    if (hasReactions) tabs.push({ key: "reactions", label: "Reactions", icon: Heart });
    if (hasSaves) tabs.push({ key: "saves", label: "Saves", icon: Bookmark });
    return tabs;
  }, [hasReactions, hasSaves]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key ?? "videos");
    }
  }, [activeTab, visibleTabs]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
  };

  const renderVideos = () => {
    if (Array.isArray(items) && items.length === 0) {
      return <div className="mt-6 text-center text-white/70">No posts yet.</div>;
    }
    if (gridItems.length > 0) {
      return (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {gridItems.map((p) => (
            <Link
              key={p.id}
              href={`/feed/${p.id}`}
              prefetch={false}
              className="group relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900/60 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label={`Open video ${p.id} with ${formatCount(p.views)} views`}
            >
              <img
                src={p.thumbnail}
                alt="thumbnail"
                className="w-full aspect-[9/12] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
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
      );
    }
    return <div className="mt-6 text-center text-white/70">No posts yet.</div>;
  };

  const renderReactions = () => {
    if (!hasReactions) {
      return <div className="mt-6 text-center text-white/70">No reacted videos yet.</div>;
    }
    return (
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reactedItems.map((item) => (
          <MiniHorizontalCard
            key={item.reactionId}
            title={item.post.caption || "Untitled"}
            thumb={item.post.thumbnail}
            meta={`${item.reactionKey.toUpperCase()} • ${formatDate(item.reactedAt)}`}
            href={`/feed/${item.post.id}`}
          />
        ))}
      </div>
    );
  };

  const renderSaves = () => {
    if (!hasSaves) {
      return <div className="mt-6 text-center text-white/70">No saved videos yet.</div>;
    }
    return (
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {savedItems.map((item) => (
          <MiniHorizontalCard
            key={item.postId}
            title={item.post.caption || "Untitled"}
            thumb={item.post.thumbnail}
            meta={`Saved ${formatDate(item.savedAt)}`}
            href={`/feed/${item.post.id}`}
          />
        ))}
      </div>
    );
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case "reactions":
        return renderReactions();
      case "saves":
        return renderSaves();
      default:
        return renderVideos();
    }
  };

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
          <section className="max-w-7xl mx-auto px-4 py-6">
            {/* Header card - simplified to match ModernTok */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <img
                  src={avatar}
                  alt={`${displayName} avatar`}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-white/10 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold leading-tight truncate">
                    {displayName}
                  </h1>
                  <p className="text-white/70 text-sm sm:text-base">@{normalizedHandle}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/80">
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> {formatCount(followerCount)} Followers
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 inline-flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" /> {formatCount(followingCount)} Following
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 inline-flex items-center gap-1.5">
                      <Clapperboard className="w-3.5 h-3.5" /> {formatCount(postCount)} Posts
                    </span>
                  </div>
                  {profileUser?.website ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                      <Link2 className="w-3.5 h-3.5" />
                      <a
                        href={profileUser.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-white/30 underline-offset-4 hover:text-white"
                      >
                        {profileUser.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  ) : null}
                  {profileUser?.bio ? (
                    <p className="mt-2 text-sm text-white/70 leading-snug max-w-xl whitespace-pre-line">
                      {profileUser.bio}
                    </p>
                  ) : null}
                </div>
                {!isSelfProfile ? (
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      disabled={followBusy || !profileUser?._id}
                      onClick={handleFollowClick}
                      className={`px-3 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 transition ${
                        isFollowing
                          ? "bg-white/10 border border-white/10 text-white hover:bg-white/15"
                          : "bg-white text-black hover:opacity-90"
                      } ${followBusy ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <UserPlus className="w-4 h-4" /> {isFollowing ? "Following" : "Follow"}
                    </button>
                    <button className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 inline-flex items-center gap-1.5">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                ) : null}
                {!isSelfProfile ? (
                  <div className="mt-4 flex w-full gap-2 sm:hidden">
                    <button
                      disabled={followBusy || !profileUser?._id}
                      onClick={handleFollowClick}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        isFollowing
                          ? "bg-white/10 border border-white/10 text-white hover:bg-white/15"
                          : "bg-white text-black hover:opacity-90"
                      } ${followBusy ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                    <button className="rounded-xl px-3 py-2 text-sm font-medium bg-white/10 border border-white/10 text-white/90 hover:bg-white/15">
                      Share
                    </button>
                  </div>
                ) : null}
              </div>
              {followError ? (
                <p className="mt-3 text-xs text-rose-400">{followError}</p>
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

function MiniHorizontalCard({ title, thumb, meta, href }: MiniHorizontalCardProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/70 p-3 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
    >
      <img
        src={thumb || "https://via.placeholder.com/80x120?text=No+Image"}
        alt={title}
        className="h-20 w-16 rounded-lg object-cover"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold line-clamp-2">{title}</p>
        <p className="mt-1 text-xs text-white/60">{meta}</p>
      </div>
    </Link>
  );
}
