"use client";

import { JoinGroupForm } from "@/components/JoinGroupForm";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import BottomTabs from "@/components/BottomTabs";
import Link from "next/link";

export default function JoinGroupPage() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code") || "";

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white md:pt-14">
      <div className="hidden md:block">
        <TopBar />
      </div>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24 md:pb-12 md:ml-64">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">เข้าร่วมกลุ่ม</h1>
            <p className="text-white/70">ใส่รหัสเชิญเพื่อเข้าร่วมกลุ่ม</p>
          </div>

          <JoinGroupForm
            initialInviteCode={inviteCode}
            onSuccess={(orgId) => {
              window.location.href = `/organization/${orgId}`;
            }}
            onCancel={() => {
              window.history.back();
            }}
          />

          <div className="mt-8 text-center">
            <p className="text-sm text-white/60">
              ไม่มีรหัสเชิญ?{" "}
              <Link
                href="/groups/create"
                className="text-white hover:text-white/80 font-medium underline underline-offset-2"
              >
                สร้างกลุ่มของคุณเอง
              </Link>
            </p>
          </div>
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}
