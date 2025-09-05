"use client";
import { User, Compass, Home, Plus, MessageCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setAmbientColor } from "@/store/playerSlice";
import { useRouter } from "next/navigation";

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

export default function BottomTabs() {
  const navigate = useRouter();
  const dispatch = useDispatch();
  const navRef = useRef<HTMLElement | null>(null);
  const tabs = [
    { icon: Home, label: "Home", active: true },
    { icon: Compass, label: "Explore" },
    { icon: Plus, label: "Create" },
    { icon: MessageCircle, label: "Messages" },
    { icon: User, label: "Profile" },
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

    let newLink = link;
    if (link === "/home") newLink = "/";
    if (link === "/explore") newLink = "/explore";
    if (link === "/create") newLink = "/upload";
    if (link === "/messages") newLink = "/messages";
    if (link === "/profile") newLink = "/profile";

    navigate.push(newLink);
  };

  return (
    <nav
      ref={navRef as any}
      data-bottom-tabs
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/10 bg-neutral-950/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex justify-around items-center py-2">
        {tabs.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            onClick={() => handleNavigation(`/${label.toLowerCase()}`)}
            className="flex flex-col items-center gap-0.5 text-[11px]"
          >
            <Icon className={classNames("w-5 h-5", active && "text-white")} />
            <span
              className={classNames(
                "",
                active ? "text-white" : "text-white/60"
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
