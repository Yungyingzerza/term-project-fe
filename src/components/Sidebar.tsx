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
import Image from "next/image";
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
    { icon: Home, label: "เพื่อคุณ", link: "/" },
    { icon: Users, label: "กำลังติดตาม", link: "/following" },
    { icon: Radio, label: "ไลฟ์สด", link: "/live" },
    { icon: Compass, label: "สำรวจ", link: "/explore" },
    { icon: MessageCircle, label: "ข้อความ", link: "/messages" },
    {
      icon: User,
      label: "โปรไฟล์",
      link: user?.username ? `/${user.handle}` : "/profile",
    },
  ];
  const items = isLoggedIn
    ? itemsBase
    : itemsBase.filter(
        (i) => !["กำลังติดตาม", "ข้อความ", "โปรไฟล์"].includes(i.label)
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
          <span className="font-semibold">ค้นพบ</span>
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
            );
          })}
        </nav>
        {isLoggedIn ? (
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-xs text-white/60">องค์กรของคุณ</p>
              <button
                onClick={() => handleNavigation("/groups")}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
                title="จัดการกลุ่ม"
              >
                + สร้าง
              </button>
            </div>
            {orgStatus === "loading" ? (
              <div className="text-sm text-white/60 px-3 py-2">
                กำลังโหลดองค์กร...
              </div>
            ) : orgStatus === "failed" ? (
              <div className="text-sm text-red-400 px-3 py-2">
                {orgError || "ไม่สามารถโหลดองค์กรได้"}
              </div>
            ) : organizations.length > 0 ? (
              organizations.map((org) => {
                const link = `/organization/${org._id}`;
                const isActive = pathname?.startsWith(link);
                return (
                  <button
                    key={org._id}
                    onClick={() => handleNavigation(link)}
                    className={classNames(
                      "cursor-pointer w-full flex items-center px-3 py-2 rounded-xl hover:bg-white/5 transition text-left",
                      isActive && "bg-white/10"
                    )}
                  >
                    {org.logo_url ? (
                      <Image
                        src={org.logo_url}
                        alt={`โลโก้ของ ${org.name}`}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-white/10 border border-white/10 grid place-items-center text-sm font-semibold">
                        {org.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="ml-3 leading-tight">
                      <p className="text-sm font-semibold">{org.name}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 space-y-2">
                <p className="text-sm text-white/60">ยังไม่มีองค์กร</p>
                <button
                  onClick={() => handleNavigation("/groups")}
                  className="w-full text-left text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  สร้างหรือเข้าร่วมกลุ่ม →
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
