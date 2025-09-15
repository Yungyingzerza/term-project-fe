import { cookies } from "next/headers";
import ProfilePage from "@/components/ProfilePage";
import type { PostItem } from "@/interfaces/post";
import type { UserMeta } from "@/interfaces/user";
import { getFeedByUserHandle } from "@/lib/api/feed";

interface PageProps {
  params: { handle: string };
  searchParams?: { cursor?: string };
}

export default async function HandleProfilePage({ params, searchParams }: PageProps) {
  const { handle } = params;
  const cursor = searchParams?.cursor;

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  let items: PostItem[] = [];
  let author: UserMeta | undefined;

  try {
    const data = await getFeedByUserHandle({
      handle,
      limit: 24,
      cursor: cursor ?? null,
      cookie: token ? `accessToken=${token}` : undefined,
    });
    items = (data?.items as PostItem[]) || [];
    if (items.length > 0) {
      author = items[0].user as UserMeta;
    } else {
      author = { handle, name: handle, avatar: "https://i.pravatar.cc/100?img=1" };
    }
  } catch {
    // Network/other errors: render page with minimal info
    author = { handle, name: handle, avatar: "https://i.pravatar.cc/100?img=1" };
  }

  return <ProfilePage author={author} items={items} />;
}
