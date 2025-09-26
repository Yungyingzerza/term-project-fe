"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import { useSelector } from "react-redux";
import type { PostItem } from "@/interfaces/post";
import type { UserMeta, UserProfileResponse } from "@/interfaces/user";
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
}

export default function ProfilePage({ author, items, profile }: ProfilePageProps) {
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
  const gridItems: MiniPost[] = hasRealItems
    ? (items as PostItem[]).map(toMini)
    : [];

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
              <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-3 text-sm">
                <button className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 font-medium inline-flex items-center gap-1.5">
                  <Clapperboard className="w-4 h-4" /> Videos
                </button>
                <button className="cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10 text-white/80 inline-flex items-center gap-1.5">
                  <Heart className="w-4 h-4" /> Likes
                </button>
                <button className="cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10 text-white/80 inline-flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4" /> Saves
                </button>
              </div>
            </div>

            {/* Empty state when fetched items exist but are empty */}
            {Array.isArray(items) && items.length === 0 ? (
              <div className="mt-6 text-center text-white/70">No posts yet.</div>
            ) : null}

            {/* Grid */}
            {gridItems.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {gridItems.map((p) => (
                  <div
                    key={p.id}
                    className="group relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open video ${p.id} with ${formatCount(p.views)} views`}
                  >
                    <img
                      src={p.thumbnail}
                      alt="thumbnail"
                      className="w-full aspect-[9/12] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  {/* Top-right views pill */}
                  <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-black/60 border border-white/10 text-[11px] flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{formatCount(p.views)}</span>
                  </div>
                  {/* Bottom-right duration */}
                  {p.duration ? (
                    <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/70 text-[11px] border border-white/10">
                      {p.duration}
                    </div>
                  ) : null}
                  {/* Center play overlay on hover */}
                  <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="h-12 w-12 rounded-full bg-black/50 border border-white/10 grid place-items-center">
                      <Play className="w-5 h-5" />
                    </div>
                  </div>
                  {/* Gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100" />
                </div>
                ))}
              </div>
            ) : null}
          </section>
        </main>
      </div>

      <div className="relative z-10">
        <BottomTabs />
      </div>
    </div>
  );
}
