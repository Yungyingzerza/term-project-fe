"use client";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import { useSelector } from "react-redux";
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
  duration: string; // mm:ss
};

const SAMPLE_GRID: MiniPost[] = [
  {
    id: "p1",
    thumbnail:
      "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop",
    videoSrc: "/test.mp4",
    views: 6400,
    duration: "00:27",
  },
  {
    id: "p2",
    thumbnail:
      "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=1600&auto=format&fit=crop",
    videoSrc: "/Download.mp4",
    views: 17800,
    duration: "00:42",
  },
  {
    id: "p3",
    thumbnail:
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=1600&auto=format&fit=crop",
    videoSrc: "/Download (1).mp4",
    views: 302100,
    duration: "01:12",
  },
  {
    id: "p4",
    thumbnail:
      "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=1600&auto=format&fit=crop",
    videoSrc: "/Download (2).mp4",
    views: 9250,
    duration: "00:18",
  },
  {
    id: "p5",
    thumbnail:
      "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=1600&auto=format&fit=crop",
    videoSrc: "/mov_bbb.mp4",
    views: 1234000,
    duration: "00:09",
  },
  {
    id: "p6",
    thumbnail:
      "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop",
    videoSrc: "/test.mp4",
    views: 6400,
    duration: "00:27",
  },
];

export default function ProfilePage() {
  const ambientColor = useSelector((s: any) => s.player.ambientColor) as string;
  const user = useSelector((s: any) => s.user) as {
    username: string;
    picture_url: string;
  };
  const displayName = user?.username || "Lumina";
  const handle = user?.username ? `@${user.username}` : "@lumina.ai";
  const avatar = user?.picture_url || "https://i.pravatar.cc/100?img=1";

  const formatCount = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black overflow-hidden overscroll-none pt-14">
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

      <div className="relative z-10 flex">
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
                  <p className="text-white/70 text-sm sm:text-base">{handle}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/80">
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> 1.2M Followers
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 inline-flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" /> 356 Following
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 inline-flex items-center gap-1.5">
                      <Clapperboard className="w-3.5 h-3.5" /> 84 Posts
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                    <Link2 className="w-3.5 h-3.5" />
                    <a
                      href="#"
                      className="underline decoration-white/30 underline-offset-4 hover:text-white"
                    >
                      lumina.dev/links
                    </a>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <button className="cursor-pointer px-3 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90 inline-flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" /> Follow
                  </button>
                  <button className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 inline-flex items-center gap-1.5">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>

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

            {/* Grid */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {SAMPLE_GRID.map((p) => (
                <div
                  key={p.id}
                  className="group relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open video ${p.id} with ${formatCount(
                    p.views
                  )} views`}
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
                  <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/70 text-[11px] border border-white/10">
                    {p.duration}
                  </div>
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
          </section>
        </main>
      </div>

      <div className="relative z-10">
        <BottomTabs />
      </div>
    </div>
  );
}
