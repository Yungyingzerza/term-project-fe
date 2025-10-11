import { cookies } from "next/headers";
import ProfilePage from "@/components/ProfilePage";
import type { PostItem } from "@/interfaces/post";
import type {
  SavedVideosResponse,
  UserMeta,
  UserProfileResponse,
  UserReactionsResponse,
  ViewHistoryResponse,
} from "@/interfaces/user";
import { getFeedByUserHandle } from "@/lib/api/feed";
import {
  getUserIdByHandle,
  getUserProfile,
  getUserReactions,
  getUserSavedVideos,
  getUserViewHistory,
} from "@/lib/api/user";

interface PageProps {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HandleProfilePage(props: PageProps) {
  const params = await props.params;
  const { handle } = params;
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  const cursorParam = resolvedSearchParams?.cursor;
  const cursor = Array.isArray(cursorParam) ? cursorParam[0] : cursorParam;

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  let items: PostItem[] = [];
  let author: UserMeta | undefined;
  let profile: UserProfileResponse | undefined;
  let userId: string | undefined;
  let reacted: UserReactionsResponse | undefined;
  let saved: SavedVideosResponse | undefined;
  let history: ViewHistoryResponse | undefined;
  let videoPaging: { nextCursor: string | null; hasMore: boolean } | undefined;

  try {
    const lookup = await getUserIdByHandle(handle, {
      cookie: token ? `accessToken=${token}` : undefined,
    });
    userId = lookup?.userId;
  } catch {
    // ignore; we can still attempt to render with fallback
  }

  if (userId) {
    try {
      profile = await getUserProfile(userId, {
        cookie: token ? `accessToken=${token}` : undefined,
      });
    } catch {
      // ignore errors; fallback to feed-derived info
    }

    try {
      reacted = await getUserReactions(
        { limit: 12 },
        { cookie: token ? `accessToken=${token}` : undefined }
      );
    } catch {
      // ignore if reacted videos not available
    }

    try {
      saved = await getUserSavedVideos(
        { limit: 12 },
        { cookie: token ? `accessToken=${token}` : undefined }
      );
    } catch {
      // ignore if saved videos not available
    }

    try {
      history = await getUserViewHistory(
        { limit: 12 },
        { cookie: token ? `accessToken=${token}` : undefined }
      );
    } catch {
      // ignore if view history not available
    }
  }

  try {
    const data = await getFeedByUserHandle({
      handle,
      limit: 12,
      cursor: cursor ?? null,
      cookie: token ? `accessToken=${token}` : undefined,
    });
    items = (data?.items as PostItem[]) || [];
    videoPaging = data?.paging;
  } catch {
    // ignore; we can still render profile info if available
  }

  if (items.length > 0) {
    author = items[0].user as UserMeta;
  } else if (profile?.user) {
    const u = profile.user;
    author = {
      handle: u.handle || handle,
      name: u.username || u.handle || handle,
      avatar: u.picture_url || "https://i.pravatar.cc/100?img=1",
    };
  } else {
    author = {
      handle,
      name: handle,
      avatar: "https://i.pravatar.cc/100?img=1",
    };
  }

  return (
    <ProfilePage
      author={author}
      items={items}
      profile={profile}
      reacted={reacted}
      saved={saved}
      history={history}
      videoPaging={videoPaging}
    />
  );
}
