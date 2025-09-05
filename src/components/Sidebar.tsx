"use client";
import { Compass, Home, Radio, Sparkles, Users } from "lucide-react";
import { useDispatch } from "react-redux";
import { setAmbientColor } from "@/store/playerSlice";
import { useRouter } from "next/navigation";

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const navigate = useRouter();
  const dispatch = useDispatch();

  const items = [
    { icon: Home, label: "For You", link: "/", active: true },
    { icon: Users, label: "Following", link: "/following" },
    { icon: Compass, label: "Explore", link: "/explore" },
    { icon: Radio, label: "Live", link: "/live" },
  ];
  const orgs = [
    { name: "OpenAI", logo: "https://logo.clearbit.com/openai.com" },
    { name: "Vercel", logo: "https://logo.clearbit.com/vercel.com" },
    { name: "GitHub", logo: "https://logo.clearbit.com/github.com" },
    { name: "Stripe", logo: "https://logo.clearbit.com/stripe.com" },
    { name: "Notion", logo: "https://logo.clearbit.com/notion.so" },
  ];

  //handle navigation
  const handleNavigation = (link: string) => {
    //reset ambient color on navigation
    dispatch(setAmbientColor("transparent"));

    navigate.push(link);
  };

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 border-r border-white/10 bg-neutral-950/40 backdrop-blur-xl">
      <div className="p-4 w-full">
        <div className="flex items-center gap-2 px-2 py-3 rounded-xl bg-white/5 border border-white/10">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Discover</span>
        </div>
        <nav className="mt-4 space-y-1">
          {items.map(({ icon: Icon, label, link, active }) => (
            <button
              key={label}
              onClick={() => handleNavigation(link)}
              className={classNames(
                "cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition",
                active && "bg-white/10"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-6">
          <p className="text-xs text-white/60 px-3 mb-2">Your Organizations</p>
          {orgs.map((org) => (
            <div
              key={org.name}
              className="cursor-pointer flex items-center px-3 py-2 rounded-xl hover:bg-white/5 transition"
            >
              <img
                src={org.logo}
                alt={`${org.name} logo`}
                className="w-8 h-8 rounded"
              />
              <div className="ml-3 leading-tight">
                <p className="text-sm font-semibold">{org.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
