"use client";
import {
  Compass,
  Home,
  Radio,
  Sparkles,
  Users,
  User,
  MessageCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAmbientColor } from "@/store/playerSlice";
import { usePathname, useRouter } from "next/navigation";
import { useUserOrganizations } from "@/hooks/useUserOrganizations";

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const navigate = useRouter();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const user = useAppSelector((s) => s.user);
  const isLoggedIn = !!(user?.id || user?.username);
  const {
    organizations,
    status: orgStatus,
    error: orgError,
  } = useUserOrganizations({ enabled: isLoggedIn });

  const itemsBase = [
    { icon: Home, label: "For You", link: "/" },
    { icon: Users, label: "Following", link: "/following" },
    { icon: Radio, label: "Live", link: "/live" },
    { icon: Compass, label: "Explore", link: "/explore" },
    { icon: MessageCircle, label: "Messages", link: "/messages" },
    { icon: User, label: "Profile", link: user?.username ? `/${user.username}` : "/profile" },
  ];
  const items = isLoggedIn
    ? itemsBase
    : itemsBase.filter(
        (i) => !["Following", "Messages", "Profile"].includes(i.label)
      );
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
          {items.map(({ icon: Icon, label, link }) => {
            const isActive =
              link === "/"
                ? pathname === "/"
                : pathname === link || pathname.startsWith(link + "/");
            return (
            <button
              key={label}
              onClick={() => handleNavigation(link)}
              className={classNames(
                "cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition",
                isActive && "bg-white/10"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          );})}
        </nav>
        {isLoggedIn ? (
          <div className="mt-6">
            <p className="text-xs text-white/60 px-3 mb-2">Your Organizations</p>
            {orgStatus === "loading" ? (
              <div className="text-sm text-white/60 px-3 py-2">
                Loading organizations...
              </div>
            ) : orgStatus === "failed" ? (
              <div className="text-sm text-red-400 px-3 py-2">
                {orgError || "Unable to load organizations"}
              </div>
            ) : organizations.length > 0 ? (
              organizations.map((org) => (
                <div
                  key={org._id}
                  className="cursor-pointer flex items-center px-3 py-2 rounded-xl hover:bg-white/5 transition"
                >
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={`${org.name} logo`}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/10 border border-white/10 grid place-items-center text-sm font-semibold">
                      {org.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="ml-3 leading-tight">
                    <p className="text-sm font-semibold">{org.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-white/60 px-3 py-2">
                No organizations yet
              </div>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
