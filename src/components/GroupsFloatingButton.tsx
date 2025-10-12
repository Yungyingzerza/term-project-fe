"use client";

import { useState } from "react";
import { Users, Plus, LogIn, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function GroupsFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 md:hidden z-40 w-14 h-14 bg-white text-black rounded-2xl shadow-lg flex items-center justify-center transition-all hover:opacity-90 border border-white/10"
        aria-label="เมนูกลุ่ม"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Users className="w-6 h-6" />}
      </button>

      {/* Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Items */}
          <div className="fixed bottom-36 right-4 md:hidden z-40 bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 overflow-hidden min-w-[200px]">
            <button
              onClick={() => handleNavigation("/groups")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/10"
            >
              <Users className="w-5 h-5 text-white/90" />
              <span className="text-sm font-medium whitespace-nowrap">
                กลุ่มทั้งหมด
              </span>
            </button>

            <button
              onClick={() => handleNavigation("/groups/create")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/10"
            >
              <Plus className="w-5 h-5 text-white/90" />
              <span className="text-sm font-medium whitespace-nowrap">
                สร้างกลุ่ม
              </span>
            </button>

            <button
              onClick={() => handleNavigation("/groups/join")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <LogIn className="w-5 h-5 text-white/90" />
              <span className="text-sm font-medium whitespace-nowrap">
                เข้าร่วมกลุ่ม
              </span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
