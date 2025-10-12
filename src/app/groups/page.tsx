import { Metadata } from "next";
import Link from "next/link";
import { Plus, LogIn, Users, Key, Shield } from "lucide-react";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import BottomTabs from "@/components/BottomTabs";

export const metadata: Metadata = {
  title: "กลุ่ม - ชิลชิล",
  description: "จัดการกลุ่มและชุมชนของคุณ",
};

export default function GroupsPage() {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-white overflow-hidden md:pt-14">
      <div className="hidden md:block">
        <TopBar />
      </div>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 border border-white/10">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold mb-3">กลุ่ม</h1>
            <p className="text-lg text-white/70">
              สร้างชุมชน เชื่อมต่อ และร่วมงานกับผู้อื่น
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Create Group Card */}
            <Link
              href="/groups/create"
              className="group bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-neutral-900/80 hover:border-white/20 transition-all"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors border border-white/10">
                  <Plus className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">สร้างกลุ่ม</h2>
                <p className="text-white/70">
                  เริ่มต้นชุมชนของคุณและเชิญสมาชิก
                </p>
              </div>
            </Link>

            {/* Join Group Card */}
            <Link
              href="/groups/join"
              className="group bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-neutral-900/80 hover:border-white/20 transition-all"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors border border-white/10">
                  <LogIn className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">เข้าร่วมกลุ่ม</h2>
                <p className="text-white/70">
                  ใช้รหัสเชิญเพื่อเข้าร่วมกลุ่มที่มีอยู่
                </p>
              </div>
            </Link>
          </div>

          {/* Features Section */}
          <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6">ฟีเจอร์ของกลุ่ม</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">จัดการสมาชิก</h4>
                  <p className="text-sm text-white/70">
                    เชิญสมาชิกและจัดการบทบาท
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">รหัสเชิญ</h4>
                  <p className="text-sm text-white/70">
                    สร้างลิงก์เชิญที่ปลอดภัย
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">ควบคุมโดยผู้ดูแล</h4>
                  <p className="text-sm text-white/70">
                    ควบคุมกลุ่มของคุณอย่างเต็มที่
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}
