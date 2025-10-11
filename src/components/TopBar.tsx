"use client";
import { Search, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { setAmbientColor } from "@/store/playerSlice";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function TopBar() {
  const navigate = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.user);
  const isLoggedIn = !!(user?.id || user?.username);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  //handle navigation
  const handleNavigation = (link: string) => {
    dispatch(setAmbientColor("transparent"));

    navigate.push(link);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // Navigate to explore page with search query
    const encodedQuery = encodeURIComponent(trimmed);
    handleNavigation(`/explore?q=${encodedQuery}`);

    // Clear the search input after navigation
    setSearchQuery("");
  };

  // Close dropdown on outside click or Esc
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);

      // Focus search input when "/" is pressed (unless already in an input)
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-white/10 bg-neutral-950/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-3">
        <div
          onClick={() => handleNavigation("/")}
          className="cursor-pointer flex items-center gap-2 font-extrabold text-lg"
        >
          <div className="w-7 h-7 rounded-lg bg-white text-black grid place-items-center">
            CC
          </div>
          <span className="hidden sm:inline">ชิลชิล</span>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="group relative">
            <input
              ref={searchInputRef}
              placeholder="ค้นหา"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-12 py-2.5 outline-none focus:border-white/20"
            />
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 bg-white/10 rounded-md text-white/60">
              /
            </kbd>
          </form>
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <button
                className="hidden cursor-pointer sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90"
                onClick={() => handleNavigation("/upload")}
              >
                <Upload className="w-4 h-4" /> อัปโหลด
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  className="inline-block cursor-pointer"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <Image
                    src={user?.picture_url || "https://i.pravatar.cc/80?img=5"}
                    className="w-8 h-8 rounded-full"
                    alt="เมนูโปรไฟล์"
                    width={32}
                    height={32}
                    unoptimized
                  />
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-neutral-900/90 backdrop-blur-md shadow-xl py-1 z-50"
                  >
                    <button
                      role="menuitem"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                      onClick={() => {
                        setMenuOpen(false);
                        handleNavigation(
                          user?.handle ? `/${user.handle}` : "/profile"
                        );
                      }}
                    >
                      โปรไฟล์
                    </button>
                    <button
                      role="menuitem"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                      onClick={() => {
                        setMenuOpen(false);
                        handleNavigation("/settings");
                      }}
                    >
                      การตั้งค่า
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <button
              className="cursor-pointer sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90"
              onClick={() => {
                // Redirect to external authentication if not logged in
                if (process.env.NEXT_PUBLIC_BASE_API) {
                  window.location.href = `${process.env.NEXT_PUBLIC_BASE_API}/line/authentication`;
                } else {
                  handleNavigation("/");
                }
              }}
            >
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
