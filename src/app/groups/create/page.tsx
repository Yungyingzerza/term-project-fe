"use client";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import BottomTabs from "@/components/BottomTabs";

export default function CreateGroupPage() {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-white overflow-hidden md:pt-14">
      <div className="hidden md:block">
        <TopBar />
      </div>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">สร้างกลุ่มใหม่</h1>
            <p className="text-white/70">เริ่มต้นชุมชนและเชิญผู้อื่นเข้าร่วม</p>
          </div>

          <CreateGroupForm
            onSuccess={(orgId) => {
              window.location.href = `/organization/${orgId}`;
            }}
            onCancel={() => {
              window.history.back();
            }}
          />
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}
