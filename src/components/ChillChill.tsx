"use client";
import BottomTabs from "./BottomTabs";
import Feed from "./Feed";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { GroupsFloatingButton } from "./GroupsFloatingButton";
import { useAppSelector } from "@/store/hooks";
import type { FeedAlgo } from "@/hooks/useFeed";
import type { PostItem } from "@/interfaces";

interface ChillChillProps {
  seedItems?: PostItem[];
  seedCursor?: string | null;
  seedHasMore?: boolean;
  autoFetch?: boolean;
  forcedAlgo?: FeedAlgo;
  organizationId?: string | null;
}

export default function ChillChill({
  seedItems = [],
  seedCursor = null,
  seedHasMore = true,
  autoFetch = true,
  forcedAlgo,
  organizationId = null,
}: ChillChillProps = {}) {
  const ambientColor = useAppSelector((s) => s.player.ambientColor);
  return (
    <div className="relative min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black overflow-hidden overscroll-none md:pt-14">
      {/* Ambient overlay (YouTube-like). Uses a radial mask so background-color can transition smoothly */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-[background-color,opacity] duration-700 ease-linear"
        style={{
          backgroundColor: ambientColor,
          opacity: 0.5,
          filter: "blur(60px)",
        }}
      />
      {/* TopBar is hidden on mobile (< md) since we have BottomTabs */}
      <div className="hidden md:block">
        <TopBar />
      </div>
      <div className="relative z-10 flex">
        <Sidebar />
        <Feed
          seedItems={seedItems}
          seedCursor={seedCursor}
          seedHasMore={seedHasMore}
          autoFetch={autoFetch}
          forcedAlgo={forcedAlgo}
          organizationId={organizationId}
        />
      </div>
      <div className="relative z-10">
        <BottomTabs />
      </div>
      {/* Floating Groups Button for Mobile */}
      <GroupsFloatingButton />
    </div>
  );
}
