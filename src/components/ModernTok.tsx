import BottomTabs from "./BottomTabs";
import Feed from "./Feed";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function ModernTok() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black overflow-hidden">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <Feed />
      </div>
      <BottomTabs />
    </div>
  );
}

