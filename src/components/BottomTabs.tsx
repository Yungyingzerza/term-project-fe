"use client";
import { User, Compass, Home, Plus, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

  // State for long-press menu
  const [showMenu, setShowMenu] = useState(false);
  const [menuItems, setMenuItems] = useState<
    Array<{ label: string; link: string }>
  >([]);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const tabsBase = [
    { icon: Home, label: "หน้าหลัก", link: "/" },
    { icon: Compass, label: "สำรวจ", link: "/explore" },
    { icon: Plus, label: "สร้าง", link: "/upload" },
    { icon: MessageCircle, label: "ข้อความ", link: "/messages" },
    {
      icon: User,
      label: "โปรไฟล์",
      link: user?.handle ? `/${user.handle}` : "/profile",
    },
  ];
  const tabs = isLoggedIn
    ? tabsBase
    : [
        { icon: Home, label: "หน้าหลัก", link: "/" },
        { icon: Compass, label: "สำรวจ", link: "/explore" },
        {
          icon: User,
          label: "เข้าสู่ระบบ",
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

  // Handle long press start
  const handleLongPressStart = (
    e: React.TouchEvent | React.MouseEvent,
    tabLabel: string
  ) => {
    e.preventDefault();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    longPressTimer.current = setTimeout(() => {
      let items: Array<{ label: string; link: string }> = [];

      if (tabLabel === "หน้าหลัก") {
        items = [
          { label: "หน้าหลัก", link: "/" },
          { label: "กำลังติดตาม", link: "/following" },
        ];
      } else if (tabLabel === "โปรไฟล์") {
        items = [
          {
            label: "โปรไฟล์",
            link: user?.handle ? `/${user.handle}` : "/profile",
          },
          { label: "ตั้งค่า", link: "/settings" },
        ];
      }

      if (items.length > 0) {
        // Clamp x position to prevent overflow
        const menuWidth = 140; // maxWidth
        const screenWidth = window.innerWidth;
        const clampedX = Math.max(
          menuWidth / 2 + 10,
          Math.min(x, screenWidth - menuWidth / 2 - 10)
        );

        setMenuItems(items);
        setMenuPosition({ x: clampedX, y });
        setShowMenu(true);

        // Haptic feedback if available
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }
      }
    }, 500); // 500ms long press
  };

  // Handle long press end
  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Handle menu item click
  const handleMenuItemClick = (link: string) => {
    setShowMenu(false);
    handleNavigation(link);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <>
      {/* Long-press menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50" style={{ pointerEvents: "auto" }}>
          <div
            className="absolute bg-neutral-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden"
            style={{
              left: `${menuPosition.x}px`,
              bottom: `calc(100vh - ${menuPosition.y}px + 10px)`,
              transform: "translateX(-50%)",
              minWidth: "120px",
              maxWidth: "140px",
            }}
          >
            {menuItems.map((item, index) => (
              <button
                key={item.link}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuItemClick(item.link);
                }}
                className={classNames(
                  "w-full px-4 py-2.5 text-left text-xs transition-colors whitespace-nowrap",
                  "hover:bg-white/10 active:bg-white/20",
                  pathname === item.link
                    ? "text-white font-semibold"
                    : "text-white/80",
                  index !== menuItems.length - 1 && "border-b border-white/5"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav
        ref={navRef}
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

            const hasLongPress = label === "หน้าหลัก" || label === "โปรไฟล์";

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
                onTouchStart={
                  hasLongPress
                    ? (e) => handleLongPressStart(e, label)
                    : undefined
                }
                onTouchEnd={hasLongPress ? handleLongPressEnd : undefined}
                onTouchCancel={hasLongPress ? handleLongPressEnd : undefined}
                onMouseDown={
                  hasLongPress
                    ? (e) => handleLongPressStart(e, label)
                    : undefined
                }
                onMouseUp={hasLongPress ? handleLongPressEnd : undefined}
                onMouseLeave={hasLongPress ? handleLongPressEnd : undefined}
                className="flex flex-col items-center gap-0.5 text-[11px] relative"
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
                {hasLongPress && (
                  <div className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-blue-400/50" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
