"use client";
import BottomTabs from "./BottomTabs";
import Feed from "./Feed";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useSelector } from "react-redux";

export default function ModernTok() {
  const ambientColor = useSelector((s: any) => s.player.ambientColor) as string;
  return (
    <div className="relative min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black overflow-hidden pt-14">
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
      <TopBar />
      <div className="relative z-10 flex">
        <Sidebar />
        <Feed />
      </div>
      <div className="relative z-10">
        <BottomTabs />
      </div>
    </div>
  );
}
