"use client";
import {
  Compass,
  Home,
  Sparkles,
  Users,
  User,
  MessageCircle,
  CheckCircle,
  UserPlus,
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
    { icon: UserPlus, label: "เพื่อน", link: "/friends" },
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
        (i) =>
          !["กำลังติดตาม", "เพื่อน", "ข้อความ", "โปรไฟล์"].includes(i.label)
      );
  //handle navigation
  const handleNavigation = (link: string) => {
    //reset ambient color on navigation
    dispatch(setAmbientColor("transparent"));

    navigate.push(link);
  };

  return (
    <aside
      className="hidden md:flex md:w-64 shrink-0 border-r border-white/10 bg-neutral-950/40 backdrop-blur-xl overflow-hidden md:fixed md:left-0 md:top-14 md:z-40"
      style={{
        height: "calc(100vh - 56px)",
      }}
    >
      <div className="p-4 w-full overflow-y-auto scroll-smoothbar flex flex-col">
        <div className="flex items-center gap-2 px-2 py-3 rounded-xl bg-white/5 border border-white/10 shrink-0 mb-4">
          <Image
            src="/apple-touch-icon.png"
            alt="ChillChill Logo"
            width={24}
            height={24}
            className="w-6 h-6 rounded"
          />
          <span className="font-semibold text-lg">ชิวชิว</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-3 rounded-xl bg-white/5 border border-white/10 shrink-0">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">ค้นพบ</span>
        </div>
        <nav className="mt-4 space-y-1 shrink-0">
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
          <div className="mt-6 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-3 mb-2 shrink-0">
              <p className="text-xs text-white/60">องค์กร/กลุ่มของคุณ</p>
              <button
                onClick={() => handleNavigation("/groups")}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
                title="จัดการกลุ่ม"
              >
                + สร้าง
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smoothbar">
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
                      <div className="ml-3 leading-tight flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold truncate">
                            {org.name}
                          </p>
                          {org.is_work_org && (
                            <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
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
          </div>
        ) : null}
      </div>
    </aside>
  );
}
