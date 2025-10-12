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
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const hoveredKeyRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const touchStartedOnMainRef = useRef(false);
  const movedOffMainRef = useRef(false);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);
  const canHoverRef = useRef(true);

  // Detect if device supports hover
  useEffect(() => {
    try {
      const hasHover =
        typeof window !== "undefined" &&
        !!(
          (window.matchMedia &&
            window.matchMedia("(any-hover: hover)").matches) ||
          (window.matchMedia && window.matchMedia("(hover: hover)").matches) ||
          (window.matchMedia &&
            window.matchMedia("(any-pointer: fine)").matches) ||
          (window.matchMedia && window.matchMedia("(pointer: fine)").matches)
        );
      canHoverRef.current = hasHover;
    } catch {
      canHoverRef.current = true;
    }
  }, []);

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
    longPressTriggered.current = false;
    touchStartedOnMainRef.current = true;
    movedOffMainRef.current = false;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
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
    }, 300); // 300ms long press
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Handle long press end
  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Only auto-navigate if user dragged over a menu item
    // Otherwise keep menu open for clicking
    if (showMenu && hoveredKeyRef.current !== null && movedOffMainRef.current) {
      const selectedItem = menuItems[hoveredKeyRef.current];
      if (selectedItem) {
        handleMenuItemClick(selectedItem.link);
      }
    }

    // Clear hover state but keep menu open
    hoveredKeyRef.current = null;
    setHoveredItemIndex(null);

    // Suppress the click only if long-press ended on main button (no drag)
    suppressClickRef.current =
      touchStartedOnMainRef.current && !movedOffMainRef.current;
    touchStartedOnMainRef.current = false;
    movedOffMainRef.current = false;
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    hoveredKeyRef.current = null;
    setHoveredItemIndex(null);
    longPressTriggered.current = false;
    setShowMenu(false);
    touchStartedOnMainRef.current = false;
    movedOffMainRef.current = false;
  };

  // Handle mouse/touch move to detect hover over menu items
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!longPressTriggered.current) return;

    const t = e.touches && e.touches[0];
    if (!t) return;

    const el = document.elementFromPoint(
      t.clientX,
      t.clientY
    ) as HTMLElement | null;
    const btn = el?.closest("button[data-menu-index]") as HTMLElement | null;
    const index = btn ? parseInt(btn.dataset?.menuIndex || "-1") : -1;
    const validIndex = index >= 0 ? index : null;

    if (hoveredKeyRef.current !== validIndex) {
      hoveredKeyRef.current = validIndex;
      setHoveredItemIndex(validIndex);
    }

    if (validIndex !== null) {
      movedOffMainRef.current = true;
    }
  };

  // Handle menu item click
  const handleMenuItemClick = (link: string) => {
    setShowMenu(false);
    // Use setTimeout to ensure navigation happens after menu closes
    setTimeout(() => {
      handleNavigation(link);
    }, 0);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (showMenu) {
        // Check if click is outside the menu
        const target = e.target as HTMLElement;
        if (!target.closest(".long-press-menu")) {
          setShowMenu(false);
          setHoveredItemIndex(null);
          hoveredKeyRef.current = null;
        }
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
            className="long-press-menu absolute bg-neutral-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden"
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
                data-menu-index={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuItemClick(item.link);
                }}
                onMouseEnter={() => {
                  if (canHoverRef.current) {
                    setHoveredItemIndex(index);
                  }
                }}
                onMouseLeave={() => {
                  if (canHoverRef.current) {
                    setHoveredItemIndex(null);
                  }
                }}
                className={classNames(
                  "menu-item-button w-full px-4 py-2.5 text-left text-xs transition-colors whitespace-nowrap",
                  hoveredItemIndex === index
                    ? "bg-white/20 text-white font-semibold"
                    : "hover:bg-white/10 active:bg-white/20",
                  pathname === item.link && hoveredItemIndex !== index
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

            return hasLongPress ? (
              <div
                key={label}
                className="relative"
                onMouseEnter={() => {
                  if (!canHoverRef.current) return;
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                }}
                onMouseLeave={() => {
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                  closeTimer.current = setTimeout(
                    () => setShowMenu(false),
                    120
                  );
                }}
                onTouchStart={() => {
                  touchStartedOnMainRef.current = true;
                  movedOffMainRef.current = false;
                }}
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => {
                  if (!longPressTriggered.current) return;
                  e.preventDefault();
                  e.stopPropagation();

                  const key = hoveredKeyRef.current;
                  // Only auto-navigate if user dragged to a menu item
                  if (
                    key !== null &&
                    menuItems[key] &&
                    movedOffMainRef.current
                  ) {
                    handleMenuItemClick(menuItems[key].link);
                  }
                  // Otherwise keep menu open for clicking

                  hoveredKeyRef.current = null;
                  setHoveredItemIndex(null);
                  suppressClickRef.current =
                    touchStartedOnMainRef.current && !movedOffMainRef.current;
                  touchStartedOnMainRef.current = false;
                  movedOffMainRef.current = false;
                }}
                onTouchCancel={handleTouchCancel}
              >
                <button
                  onClick={() => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }

                    if (external) {
                      try {
                        window.location.href = link;
                      } catch {
                        handleNavigation("/");
                      }
                    } else {
                      handleNavigation(link);
                    }
                    if (showMenu) setShowMenu(false);
                  }}
                  onMouseDown={(e) => handleLongPressStart(e, label)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onTouchStart={(e) => handleLongPressStart(e, label)}
                  onTouchEnd={cancelLongPress}
                  onTouchCancel={cancelLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onMouseEnter={() => {
                    if (!canHoverRef.current) return;
                    if (closeTimer.current) clearTimeout(closeTimer.current);
                    // Open menu on hover for desktop
                    const mockEvent = {
                      currentTarget: {
                        getBoundingClientRect: () => ({
                          left: 0,
                          top: 0,
                          width: 48,
                          height: 48,
                        }),
                      },
                    } as React.MouseEvent;
                    handleLongPressStart(mockEvent, label);
                    longPressTriggered.current = true;
                  }}
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
                  <div className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-blue-400/50" />
                </button>
              </div>
            ) : (
              <button
                key={label}
                onClick={() => {
                  if (external) {
                    try {
                      window.location.href = link;
                    } catch {
                      handleNavigation("/");
                    }
                  } else {
                    handleNavigation(link);
                  }
                }}
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
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
