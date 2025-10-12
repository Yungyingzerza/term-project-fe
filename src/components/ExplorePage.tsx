"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import { useAppSelector } from "@/store/hooks";
import { searchExplore } from "@/lib/api/explore";
import type {
  ExploreResult,
  ExploreSearchType,
  ExploreSortOption,
} from "@/interfaces/explore";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Clock3,
  Eye,
  Heart,
  Building2,
  Clapperboard,
  Flame,
  Hash,
  Loader2,
  Play,
  Sparkles,
  User,
} from "lucide-react";

const TRENDING_TAGS: string[] = [
  "#เอไอ",
  "#โค้ดดิ้ง",
  "#ออกแบบ",
  "#สุขภาพ",
  "#สายกิน",
  "#ท่องเที่ยว",
  "#เกมมิ่ง",
  "#แชร์การเรียนรู้",
];

const PAGE_SIZE = 12;
const DEFAULT_POST_THUMBNAIL =
  "https://via.placeholder.com/400x533?text=No+Image";
const DEFAULT_USER_AVATAR = "https://i.pravatar.cc/100?img=1";
const DEFAULT_ORG_LOGO = "https://via.placeholder.com/160?text=Organization";

const TYPE_OPTIONS: Array<{
  id: ExploreSearchType;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "all", label: "ทั้งหมด", icon: Sparkles },
  { id: "users", label: "คน", icon: User },
  { id: "organizations", label: "องค์กร", icon: Building2 },
  { id: "posts", label: "วิดีโอ", icon: Clapperboard },
];

const SORT_OPTIONS: Array<{
  id: ExploreSortOption;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "trending", label: "มาแรง", icon: Flame },
  { id: "most_viewed", label: "ยอดวิวสูงสุด", icon: Eye },
  { id: "most_reactions", label: "ยอดรีแอคชั่น", icon: Heart },
  { id: "latest", label: "ล่าสุด", icon: Clock3 },
];

function normalizeHandle(handle: string): string {
  return handle.startsWith("@") ? handle.slice(1) : handle;
}

function resultKey(item: ExploreResult): string {
  return `${item.type}:${item.id}`;
}

export default function ExplorePage() {
  const ambientColor = useAppSelector((s) => s.player.ambientColor);
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ExploreSearchType>("posts");
  const [sortBy, setSortBy] = useState<ExploreSortOption>("trending");
  const [queryNonce, setQueryNonce] = useState(0);
  const [results, setResults] = useState<ExploreResult[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize search from URL parameter
  useEffect(() => {
    if (urlQuery) {
      setSearchTerm(urlQuery);
      setActiveQuery(urlQuery);
      setSelectedType("all");
      setSortBy("trending");
      setQueryNonce((prev) => prev + 1);
    }
  }, [urlQuery]);

  const hasActiveQuery = useMemo(
    () => activeQuery.trim().length > 0,
    [activeQuery]
  );

  const formatCount = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = searchTerm.trim();
      const sanitized = trimmed.replace(/^#+/, "");

      if (!sanitized) {
        setActiveQuery("");
        setSelectedType("posts");
        setSortBy("trending");
        setQueryNonce((prev) => prev + 1);
        setResults([]);
        setHasMore(false);
        setNextCursor(null);
        setError(null);
        return;
      }

      setSelectedType("all");
      setSortBy("trending");
      setActiveQuery(sanitized);
      setQueryNonce((prev) => prev + 1);
      setResults([]);
      setHasMore(false);
      setNextCursor(null);
      setError(null);
    },
    [searchTerm]
  );

  const handleTagClick = useCallback((tag: string) => {
    const sanitized = tag.replace(/^#+/, "").trim();
    setSearchTerm(tag);
    setResults([]);
    setHasMore(false);
    setNextCursor(null);
    setError(null);
    setSortBy("trending");

    if (!sanitized) {
      setActiveQuery("");
      setSelectedType("posts");
      setQueryNonce((prev) => prev + 1);
      return;
    }

    setActiveQuery(sanitized);
    setSelectedType("posts");
    setQueryNonce((prev) => prev + 1);
  }, []);

  const handleTypeSelect = useCallback(
    (next: ExploreSearchType) => {
      if (!hasActiveQuery || next === selectedType) return;
      setSelectedType(next);
      setResults([]);
      setHasMore(false);
      setNextCursor(null);
      setError(null);
      setQueryNonce((prev) => prev + 1);
    },
    [hasActiveQuery, selectedType]
  );

  const handleSortSelect = useCallback(
    (next: ExploreSortOption) => {
      if (hasActiveQuery || next === sortBy) return;
      setSortBy(next);
      setResults([]);
      setHasMore(false);
      setNextCursor(null);
      setError(null);
      setQueryNonce((prev) => prev + 1);
    },
    [hasActiveQuery, sortBy]
  );

  useEffect(() => {
    const controller = new AbortController();
    const trimmedQuery = activeQuery.trim();

    setLoading(true);
    setError(null);

    searchExplore({
      query: trimmedQuery || undefined,
      type: trimmedQuery ? selectedType : "posts",
      limit: PAGE_SIZE,
      signal: controller.signal,
      sortBy: trimmedQuery ? undefined : sortBy,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        setResults(data.results ?? []);
        setNextCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResults([]);
        setHasMore(false);
        setNextCursor(null);
        setError(
          err instanceof Error ? err.message : "ไม่สามารถโหลดผลการค้นหาได้"
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [activeQuery, selectedType, sortBy, queryNonce]);

  const handleLoadMore = useCallback(async () => {
    const trimmedQuery = activeQuery.trim();
    if (loadingMore || loading || !hasMore || !nextCursor) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const data = await searchExplore({
        query: trimmedQuery || undefined,
        type: trimmedQuery ? selectedType : "posts",
        limit: PAGE_SIZE,
        cursor: nextCursor,
        sortBy: trimmedQuery ? undefined : sortBy,
      });

      setResults((prev) => {
        const seen = new Set(prev.map(resultKey));
        const merged = [...prev];
        for (const result of data.results ?? []) {
          const key = resultKey(result);
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(result);
          }
        }
        return merged;
      });

      setNextCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลเพิ่มเติมได้"
      );
    } finally {
      setLoadingMore(false);
    }
  }, [
    activeQuery,
    hasMore,
    loading,
    loadingMore,
    nextCursor,
    selectedType,
    sortBy,
  ]);

  const renderResultCard = (item: ExploreResult) => {
    if (item.type === "post") {
      const thumbnail = item.thumbnail || DEFAULT_POST_THUMBNAIL;
      const viewerHandle = item.user?.handle
        ? normalizeHandle(item.user.handle)
        : "";

      return (
        <Link
          key={resultKey(item)}
          href={`/feed/${item.id}`}
          className="group relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 block"
          role="article"
          aria-label={item.caption || "วิดีโอ"}
        >
          <Image
            src={thumbnail}
            alt={item.caption || "วิดีโอ"}
            width={400}
            height={533}
            className="w-full aspect-[9/12] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            unoptimized
          />

          <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md bg-black/60 border border-white/10 text-[11px] uppercase">
            วิดีโอ
          </div>

          <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/70 text-[11px] border border-white/10">
            {formatCount(item.views)} ครั้งรับชม
          </div>

          <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="h-12 w-12 rounded-full bg-black/50 border border-white/10 grid place-items-center">
              <Play className="w-5 h-5" />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/10 to-transparent space-y-1">
            <p className="text-sm font-semibold line-clamp-2">
              {item.caption || "วิดีโอจากชุมชนชิลชิล"}
            </p>
            <p className="text-[11px] text-white/80">
              @{viewerHandle || "creator"}
            </p>
            {item.tags?.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-white/10 border border-white/10"
                  >
                    <Hash className="w-3 h-3 text-white/70" /> {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Link>
      );
    }

    if (item.type === "user") {
      const avatar = item.pictureUrl || DEFAULT_USER_AVATAR;
      const normalized = normalizeHandle(item.handle);

      return (
        <Link
          key={resultKey(item)}
          href={`/${normalized}`}
          className="group flex flex-col gap-4 rounded-xl border border-white/10 bg-neutral-900/60 p-4 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <div className="flex items-center gap-3">
            <Image
              src={avatar}
              alt={item.username || normalized}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover border border-white/10"
              loading="lazy"
              unoptimized
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold line-clamp-1">
                {item.username || normalized}
              </p>
              <p className="text-xs text-white/70 line-clamp-1">
                @{normalized}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/10 uppercase tracking-wide text-white/80">
              <User className="w-3 h-3" />
              ผู้ใช้
            </span>
            <span className="text-[11px] text-white/60">ดูโปรไฟล์ →</span>
          </div>
        </Link>
      );
    }

    const logo = item.logoUrl || DEFAULT_ORG_LOGO;

    return (
      <Link
        key={resultKey(item)}
        href={`/organization/${item.id}`}
        className="group flex flex-col gap-4 rounded-xl border border-white/10 bg-neutral-900/60 p-4 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        <div className="flex items-center gap-3">
          <Image
            src={logo}
            alt={item.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-lg object-cover border border-white/10"
            loading="lazy"
            unoptimized
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
            <p className="text-xs text-white/70 line-clamp-1">
              องค์กรพาร์ทเนอร์ในชุมชน
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/10 uppercase tracking-wide text-white/80">
            <Building2 className="w-3 h-3" />
            องค์กร
          </span>
          <span className="text-[11px] text-white/60">เยี่ยมชม →</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex flex-col relative min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black overscroll-none pt-14">
      {/* Ambient overlay to match ModernTok */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-[background-color,opacity] duration-700 ease-linear"
        style={{
          backgroundColor: ambientColor,
          opacity: 0.5,
          filter: "blur(60px)",
        }}
      />

      <TopBar />

      <div className="relative z-10 flex flex-1">
        <Sidebar />

        <main className="flex-1 pb-24 md:pb-6 md:ml-64">
          <section className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white text-black grid place-items-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold">สำรวจ</h1>
            </div>

            <div className="flex gap-2.5 flex-wrap mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-sm">
                <Flame className="w-4 h-4" /> กำลังมาแรง
              </span>
              {TRENDING_TAGS.map((tag) => (
                <button
                  key={tag}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 border border-white/10 text-sm text-white/90 transition-colors"
                  onClick={() => handleTagClick(tag)}
                  type="button"
                >
                  <Hash className="w-4 h-4 text-white/70" /> {tag}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="relative mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div className="flex-1 relative">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ค้นหาผู้คน องค์กร หรือวิดีโอ"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-28 py-2.5 outline-none focus:border-white/20 text-sm"
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                  {searchTerm ? (
                    <button
                      type="button"
                      className="text-xs text-white/60 hover:text-white/90 transition-colors"
                      onClick={() => {
                        setSearchTerm("");
                        setActiveQuery("");
                        setSelectedType("posts");
                        setSortBy("trending");
                        setQueryNonce((prev) => prev + 1);
                        setResults([]);
                        setHasMore(false);
                        setNextCursor(null);
                        setError(null);
                      }}
                    >
                      ล้าง
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    ค้นหา
                  </button>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto sm:w-auto">
                {TYPE_OPTIONS.map(({ id, label, icon: Icon }) => {
                  const isActive = selectedType === id;
                  const disabled = !hasActiveQuery && id !== "posts";
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleTypeSelect(id)}
                      disabled={disabled}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-colors ${
                        isActive
                          ? "bg-white text-black border-white"
                          : "bg-white/5 text-white/80 border-white/10"
                      } ${
                        disabled
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? "text-black"
                            : disabled
                            ? "text-white/60"
                            : "text-white/70"
                        }`}
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
            </form>

            {!hasActiveQuery ? (
              <div className="mb-6">
                <p className="mb-2 text-xs uppercase tracking-wide text-white/60">
                  จัดเรียงคอนเทนต์
                </p>
                <div className="flex gap-2 overflow-x-auto">
                  {SORT_OPTIONS.map(({ id, label, icon: Icon }) => {
                    const isActive = sortBy === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSortSelect(id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-colors ${
                          isActive
                            ? "bg-white text-black border-white"
                            : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-black" : "text-white/70"
                          }`}
                        />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            ) : null}

            {loading && results.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-52 sm:h-64 rounded-xl border border-white/10 bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-white/70">
                <p className="font-semibold text-white mb-2">
                  {hasActiveQuery ? "ไม่พบผลการค้นหา" : "ไม่มีวิดีโอที่จะแสดง"}
                </p>
                <p>
                  {hasActiveQuery
                    ? "ลองใช้คำค้นหาอื่น หรือลดตัวกรองลงเพื่อค้นหาเนื้อหาเพิ่มเติม"
                    : "กรุณาลองใหม่อีกครั้งในภายหลัง"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {results.map((item) => renderResultCard(item))}
                </div>

                {hasMore ? (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 text-sm hover:bg-white/20 transition-colors disabled:opacity-60"
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          กำลังโหลด...
                        </>
                      ) : (
                        "โหลดเพิ่มเติม"
                      )}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </main>
      </div>

      <div className="relative z-10">
        <BottomTabs />
      </div>
    </div>
  );
}
