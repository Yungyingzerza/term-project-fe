import { Compass, Home, Radio, Sparkles, Users } from "lucide-react";

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const items = [
    { icon: Home, label: "For You", active: true },
    { icon: Users, label: "Following" },
    { icon: Compass, label: "Explore" },
    { icon: Radio, label: "Live" },
  ];
  return (
    <aside className="hidden md:flex md:w-64 shrink-0 border-r border-white/10 bg-neutral-950/40 backdrop-blur-xl">
      <div className="p-4 w-full">
        <div className="flex items-center gap-2 px-2 py-3 rounded-xl bg-white/5 border border-white/10">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Discover</span>
        </div>
        <nav className="mt-4 space-y-1">
          {items.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={classNames(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition",
                active && "bg-white/10"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-6">
          <p className="text-xs text-white/60 px-3 mb-2">Suggested accounts</p>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <img
                  src={`https://i.pravatar.cc/60?img=${i + 20}`}
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
                <div className="leading-tight">
                  <p className="text-sm font-semibold">@user{i}</p>
                  <p className="text-xs text-white/60">Creator</p>
                </div>
              </div>
              <button className="text-xs px-3 py-1 rounded-full bg-white text-black font-semibold hover:opacity-90">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

