import { cookies } from "next/headers";
import ChillChill from "@/components/ChillChill";
import type { PostItem } from "@/interfaces";
import { getFeedByOrganizationId } from "@/lib/api/feed";

interface PageProps {
  params: Promise<{ orgId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OrganizationFeedPage(props: PageProps) {
  const params = await props.params;
  const { orgId } = params;
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  const cursorParam = resolvedSearchParams?.cursor;
  const cursor = Array.isArray(cursorParam) ? cursorParam[0] : cursorParam;

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  let items: PostItem[] = [];
  let hasMore = true;
  let nextCursor: string | null = null;

  try {
    const data = await getFeedByOrganizationId({
      orgId,
      limit: 24,
      cursor: cursor ?? null,
      cookie: token ? `accessToken=${token}` : undefined,
    });
    items = (data?.items as PostItem[]) ?? [];
    hasMore = !!data?.paging?.hasMore;
    nextCursor = data?.paging?.nextCursor ?? null;
  } catch {
    hasMore = false;
    nextCursor = null;
  }

  return (
    <ChillChill
      seedItems={items}
      seedCursor={nextCursor}
      seedHasMore={hasMore}
      organizationId={orgId}
    />
  );
}
