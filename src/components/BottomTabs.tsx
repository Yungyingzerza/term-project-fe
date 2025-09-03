import { Bookmark, Compass, Home, Plus, Users } from "lucide-react";

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

export default function BottomTabs() {
  const tabs = [
    { icon: Home, label: "Home", active: true },
    { icon: Compass, label: "Discover" },
    { icon: Plus, label: "Create" },
    { icon: Users, label: "Inbox" },
    { icon: Bookmark, label: "Profile" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/10 bg-neutral-950/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center py-2">
        {tabs.map(({ icon: Icon, label, active }) => (
          <button key={label} className="flex flex-col items-center gap-0.5 text-[11px]">
            <Icon className={classNames("w-5 h-5", active && "text-white")} />
            <span className={classNames("", active ? "text-white" : "text-white/60")}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
