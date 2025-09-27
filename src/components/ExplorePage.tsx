"use client";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import Image from "next/image";
import { useAppSelector } from "@/store/hooks";
import { Flame, Hash, Play, Sparkles } from "lucide-react";

type ExploreItem = {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  duration: string; // mm:ss
  tag?: string;
};

const TRENDING_TAGS: string[] = [
  "#ai",
  "#coding",
  "#design",
  "#wellness",
  "#foodie",
  "#travel",
  "#gaming",
  "#learninpublic",
];

const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: "e1",
    title: "Ambient desk setup tour",
    thumbnail:
      "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop",
    views: 12800,
    duration: "00:27",
    tag: "#setup",
  },
  {
    id: "e2",
    title: "Ramen hack in 10 minutes",
    thumbnail:
      "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=1600&auto=format&fit=crop",
    views: 51200,
    duration: "00:42",
    tag: "#ramen",
  },
  {
    id: "e3",
    title: "Posture reset for desk workers",
    thumbnail:
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=1600&auto=format&fit=crop",
    views: 302100,
    duration: "01:12",
    tag: "#wellness",
  },
  {
    id: "e4",
    title: "City night timelapse",
    thumbnail:
      "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=1600&auto=format&fit=crop",
    views: 9250,
    duration: "00:18",
    tag: "#city",
  },
  {
    id: "e5",
    title: "Cute bear montage",
    thumbnail:
      "https://images.unsplash.com/photo-1516375199443-2b5277b2aeb0?q=80&w=1600&auto=format&fit=crop",
    views: 1234000,
    duration: "00:09",
    tag: "#wildlife",
  },
  {
    id: "e6",
    title: "AI color grading walkthrough",
    thumbnail:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1600&auto=format&fit=crop",
    views: 44700,
    duration: "00:36",
    tag: "#ai",
  },
];

export default function ExplorePage() {
  const ambientColor = useAppSelector((s) => s.player.ambientColor);

  const formatCount = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
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
            {/* Header / title */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white text-black grid place-items-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold">Explore</h1>
            </div>

            {/* Trending chips */}
            <div className="flex gap-2.5 flex-wrap mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-sm">
                <Flame className="w-4 h-4" /> Trending now
              </span>
              {TRENDING_TAGS.map((t) => (
                <button
                  key={t}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 border border-white/10 text-sm text-white/90"
                >
                  <Hash className="w-4 h-4 text-white/70" />{" "}
                  {t.replace("#", "")}
                </button>
              ))}
            </div>

            {/* Grid of videos/cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {EXPLORE_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.title} • ${formatCount(
                    item.views
                  )} views`}
                >
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    width={400}
                    height={533}
                    className="w-full aspect-[9/12] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                    unoptimized
                  />

                  {/* Tag chip */}
                  {item.tag && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md bg-black/60 border border-white/10 text-[11px]">
                      {item.tag}
                    </div>
                  )}

                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/70 text-[11px] border border-white/10">
                    {item.duration}
                  </div>

                  {/* Play overlay on hover */}
                  <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="h-12 w-12 rounded-full bg-black/50 border border-white/10 grid place-items-center">
                      <Play className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Bottom gradient with title + views */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/70 via-black/10 to-transparent">
                    <p className="text-sm font-semibold line-clamp-1">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-white/80">
                      {formatCount(item.views)} views
                    </p>
                  </div>
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
