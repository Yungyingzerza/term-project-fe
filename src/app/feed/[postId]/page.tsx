import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import ChillChill from "@/components/ChillChill";
import type { PostItem } from "@/interfaces";
import { getFeed, getPostById } from "@/lib/api/feed";
import type { FeedAlgo } from "@/lib/api/feed";

interface PageProps {
  params: Promise<{
    postId: string;
  }>;
}

async function fetchPost(
  postId: string,
  cookie: string | undefined
): Promise<PostItem | null> {
  try {
    const data = await getPostById({ postId, cookie });
    return data.item;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: number }).status === 404
    ) {
      notFound();
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: number }).status === 403
    ) {
      return null;
    }
    throw error;
  }
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  try {
    const post = await fetchPost(
      params.postId,
      token ? `accessToken=${token}` : undefined
    );
    if (!post) {
      return {
        title: "ChillChill",
      };
    }
    const description =
      post.caption?.slice(0, 140) ?? "Watch the latest video.";
    return {
      title: `${
        post.user?.handle ? `@${post.user.handle}` : post.user?.name ?? "Video"
      } • ChillChill`,
      description,
      openGraph: {
        title: `${post.user?.name ?? "ChillChill"} on ChillChill`,
        description,
        type: "video.other",
        url: `/feed/${params.postId}`,
        images: post.thumbnail ? [{ url: post.thumbnail }] : undefined,
      },
      twitter: {
        card: "player",
        title: `${post.user?.name ?? "ChillChill"} on ChillChill`,
        description,
        images: post.thumbnail ? [post.thumbnail] : undefined,
      },
    };
  } catch {
    return {
      title: "ChillChill",
    };
  }
}
export default async function FeedPostPage(props: PageProps) {
  const params = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  const cookieHeader = token ? `accessToken=${token}` : undefined;

  const post = await fetchPost(params.postId, cookieHeader);

  if (!post) {
    redirect("/");
  }

  let additionalItems: PostItem[] = [];
  let nextCursor: string | null = null;
  let hasMore = false;
  let algo: FeedAlgo = "for-you";

  try {
    const feed = await getFeed({
      algo: "for-you",
      limit: 8,
      cookie: cookieHeader,
    });
    algo = feed.algo;
    nextCursor = feed.paging?.nextCursor ?? null;
    hasMore = Boolean(feed.paging?.hasMore);
    additionalItems = (feed.items ?? []).filter((item) => item.id !== post.id);
  } catch (error) {
    console.error("Failed to prefetch feed for post page", error);
  }

  const seen = new Set<string>([post.id]);
  const deduped: PostItem[] = [];
  for (const item of additionalItems) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }

  const items: PostItem[] = [post, ...deduped];

  return (
    <ChillChill
      seedItems={items}
      seedCursor={nextCursor}
      seedHasMore={hasMore}
      autoFetch={false}
      forcedAlgo={algo}
    />
  );
}

export const dynamic = "force-dynamic";
