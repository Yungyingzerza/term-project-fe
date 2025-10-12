import { cookies } from "next/headers";
import { getOrganizationDetail } from "@/lib/api/organization";
import { GroupManagement } from "@/components/GroupManagement";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import BottomTabs from "@/components/BottomTabs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ orgId: string }>;
}

// Helper to get current user (replace with your actual auth logic)
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/line/me`,
      {
        headers: {
          Cookie: `accessToken=${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch {
    return null;
  }
}

// Helper to check if user is admin
async function checkIfUserIsAdmin(orgId: string, userId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) return false;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/organization/${orgId}/members`,
      {
        headers: {
          Cookie: `accessToken=${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) return false;
    const data = await response.json();
    const member = data.members?.find((m: any) => m.user_id._id === userId);
    return member?.role === "admin";
  } catch {
    return false;
  }
}

export default async function GroupSettingsPage(props: PageProps) {
  const params = await props.params;
  const { orgId } = params;

  // Get current user
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/");
  }

  // Get organization details
  let organization;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    organization = await getOrganizationDetail(orgId, {
      cookie: token ? `accessToken=${token}` : undefined,
    });
  } catch (error) {
    redirect("/groups");
  }

  // Check if user is admin
  const isAdmin = await checkIfUserIsAdmin(
    orgId,
    currentUser._id || currentUser.id
  );

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white md:pt-14">
      <div className="hidden md:block">
        <TopBar />
      </div>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 md:ml-64">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับไปที่การตั้งค่า
            </Link>
            <div className="flex items-center gap-4">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 grid place-items-center text-xl font-semibold">
                  {organization.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{organization.name}</h1>
                <p className="text-sm text-white/60">ตั้งค่ากลุ่ม</p>
              </div>
            </div>
          </div>

          <GroupManagement
            organization={organization}
            currentUserId={currentUser._id || currentUser.id}
            isAdmin={isAdmin}
          />
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}
