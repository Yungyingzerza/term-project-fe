"use client";
import { User, Compass, Home, Plus, MessageCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAmbientColor } from "@/store/playerSlice";
import { usePathname, useRouter } from "next/navigation";

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

export default function BottomTabs() {
  const navigate = useRouter();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);
  const user = useAppSelector((s) => s.user);
  const isLoggedIn = !!(user?.id || user?.username);
  const tabsBase = [
    { icon: Home, label: "Home", link: "/" },
    { icon: Compass, label: "Explore", link: "/explore" },
    { icon: Plus, label: "Create", link: "/upload" },
    { icon: MessageCircle, label: "Messages", link: "/messages" },
    {
      icon: User,
      label: "Profile",
      link: user?.handle ? `/${user.handle}` : "/profile",
    },
  ];
  const tabs = isLoggedIn
    ? tabsBase
    : [
        { icon: Home, label: "Home", link: "/" },
        { icon: Compass, label: "Explore", link: "/explore" },
        {
          icon: User,
          label: "Login",
          link: `${process.env.NEXT_PUBLIC_BASE_API || ""}/line/authentication`,
          external: true as const,
        },
      ];
  useEffect(() => {
    const applyHeight = () => {
      const nav = navRef.current;
      if (!nav) return;
      // If hidden via CSS (display:none), height is 0 which is desired on desktop
      const h = nav.getBoundingClientRect().height || 0;
      document.documentElement.style.setProperty(
        "--bottom-tabs-h",
        `${Math.round(h)}px`
      );
      try {
        window.dispatchEvent(new CustomEvent("bottom-tabs-height-change"));
      } catch {
        // ignore if CustomEvent not available
      }
    };
    const onResize = () => applyHeight();
    applyHeight();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", onResize);
    vv?.addEventListener("scroll", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      vv?.removeEventListener("resize", onResize as EventListener);
      vv?.removeEventListener("scroll", onResize as EventListener);
    };
  }, []);

  //handle navigation
  const handleNavigation = (link: string) => {
    //reset ambient color on navigation
    dispatch(setAmbientColor("transparent"));

    navigate.push(link);
  };

  return (
    <nav
      ref={navRef as any}
      data-bottom-tabs
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/10 bg-neutral-950/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex justify-around items-center py-2">
        {tabs.map(({ icon: Icon, label, link, external }) => {
          const isActive =
            link === "/"
              ? pathname === "/" ||
                pathname.startsWith("/following") ||
                pathname.startsWith("/live")
              : pathname === link || pathname.startsWith(link + "/");
          return (
            <button
              key={label}
              onClick={() => {
                if (external) {
                  try {
                    window.location.href = link;
                  } catch {
                    // fallback: navigate to profile (middleware will redirect)
                    handleNavigation("/");
                  }
                } else {
                  handleNavigation(link);
                }
              }}
              className="flex flex-col items-center gap-0.5 text-[11px]"
            >
              <Icon
                className={classNames("w-5 h-5", isActive && "text-white")}
              />
              <span
                className={classNames(
                  "",
                  isActive ? "text-white" : "text-white/60"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
