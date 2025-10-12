"use client";
import {
  Building2,
  MoreVertical,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleMuted, setAmbientColor, setVolume } from "@/store/playerSlice";
import ActionRail from "./ActionRail";
import { Modal } from "./Modal";
import type { Organization, VideoCardProps } from "@/interfaces";
import { getOrganizationDetail } from "@/lib/api/organization";
import { followUser, getUserIdByHandle, getUserProfile } from "@/lib/api/user";
import { deleteVideo } from "@/lib/api/media";

type VideoWithCapture = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const handleLookupCache = new Map<string, string | null>();
const organizationDetailCache = new Map<string, Organization>();

export default function VideoCard({
  post,
  isActive = false,
  shouldPreload = false,
  preloadSeconds = 5,
  onWatchComplete,
}: VideoCardProps) {
  const dispatch = useAppDispatch();
  const globalMuted = useAppSelector((s) => !!s.player.muted);
  const volume = useAppSelector((s) => s.player.volume) ?? 0.7;
  const router = useRouter();
  const currentUserId = useAppSelector((s) => s.user.id);
  const muted = globalMuted && isActive;
  const [playing, setPlaying] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const prevActiveRef = useRef<boolean>(isActive);
  const samplerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSentColorRef = useRef<string | null>(null);
  const [usePosterBg, setUsePosterBg] = useState<boolean>(false);
  const [videoReady, setVideoReady] = useState<boolean>(false);
  // Only load the active card's video, but allow light preload for next card
  const shouldLoad = isActive || shouldPreload;
  const preloadDoneRef = useRef<boolean>(false);
  const isActiveRef = useRef<boolean>(isActive);
  const progressInnerRef = useRef<HTMLDivElement | null>(null);
  const lastProgressRef = useRef<number>(0);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const watchAccumulatorRef = useRef<number>(0);
  const watchStartTimestampRef = useRef<number | null>(null);
  const onWatchCompleteRef = useRef<VideoCardProps["onWatchComplete"] | null>(
    null
  );
  const lastOrgIdsKeyRef = useRef<string>("");

  // Scrubbing + thumbnail preview state
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const [previewTime, setPreviewTime] = useState<number | null>(null);
  const [previewSize, setPreviewSize] = useState<{ w: number; h: number }>({
    w: 140,
    h: 248,
  });
  const [volumeTrayOpen, setVolumeTrayOpen] = useState<boolean>(false);
  const [isAdjustingVolume, setIsAdjustingVolume] = useState<boolean>(false);
  const playingBeforeScrubRef = useRef<boolean>(true);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPreviewRequestRef = useRef<number>(0);
  const pendingSeekRef = useRef<number | null>(null);
  const volumeHideTimerRef = useRef<number | null>(null);
  const sliderValue = globalMuted ? 0 : Math.round(volume * 100);
  const sliderRatio = sliderValue / 100;
  const volumeBarRef = useRef<HTMLDivElement | null>(null);
  const volumePointerIdRef = useRef<number | null>(null);
  const normalizedHandle = post.user.handle?.startsWith("@")
    ? post.user.handle.slice(1)
    : post.user.handle;
  const [authorUserId, setAuthorUserId] = useState<string | null>(null);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState<boolean | null>(
    null
  );
  const [followBusy, setFollowBusy] = useState<boolean>(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const [followLoaded, setFollowLoaded] = useState<boolean>(false);
  const [orgDetails, setOrgDetails] = useState<Organization[]>([]);
  const [orgLoading, setOrgLoading] = useState<boolean>(false);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgPickerOpen, setOrgPickerOpen] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const authorProfileHref = normalizedHandle ? `/${normalizedHandle}` : null;
  const isFollowing = Boolean(isFollowingAuthor);
  const showFollowButton = Boolean(
    authorUserId && currentUserId && authorUserId !== currentUserId
  );
  const isOwnPost = Boolean(
    authorUserId && currentUserId && authorUserId === currentUserId
  );
  const followButtonClasses = isFollowing
    ? "ml-2 text-xs px-3 py-1 rounded-full border border-white/30 bg-white/10 text-white font-semibold hover:bg-white/20"
    : "ml-2 text-xs px-3 py-1 rounded-full bg-white text-black font-semibold hover:opacity-90";
  const hasOrganizationVisibility = Array.isArray(post.orgViewIds)
    ? post.orgViewIds.some(
        (id) => typeof id === "string" && id.trim().length > 0
      )
    : false;
  const primaryOrganization = orgDetails.length > 0 ? orgDetails[0] : null;
  const extraOrganizationCount =
    orgDetails.length > 1 ? orgDetails.length - 1 : 0;
  const remainingOrganizations =
    extraOrganizationCount > 0 ? orgDetails.slice(1) : [];

  useEffect(() => {
    onWatchCompleteRef.current = onWatchComplete;
  }, [onWatchComplete]);

  const stopAccumulatingWatch = useCallback(() => {
    if (watchStartTimestampRef.current == null) return;
    const now =
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    const elapsedMs = now - watchStartTimestampRef.current;
    if (Number.isFinite(elapsedMs) && elapsedMs > 0) {
      watchAccumulatorRef.current += elapsedMs / 1000;
    }
    watchStartTimestampRef.current = null;
  }, []);

  const startAccumulatingWatch = useCallback(() => {
    if (!isActiveRef.current) return;
    if (watchStartTimestampRef.current != null) return;
    watchStartTimestampRef.current =
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
        ? performance.now()
        : Date.now();
  }, []);

  const emitWatchTime = useCallback(() => {
    stopAccumulatingWatch();
    const seconds = watchAccumulatorRef.current;
    watchAccumulatorRef.current = 0;
    if (
      !onWatchCompleteRef.current ||
      !post?.id ||
      !Number.isFinite(seconds) ||
      seconds <= 0
    ) {
      return;
    }
    onWatchCompleteRef.current({
      postId: post.id,
      watchTimeSeconds: seconds,
    });
  }, [post.id, stopAccumulatingWatch]);

  const clearVolumeHideTimer = useCallback(() => {
    if (volumeHideTimerRef.current != null) {
      window.clearTimeout(volumeHideTimerRef.current);
      volumeHideTimerRef.current = null;
    }
  }, []);

  const openVolumeTray = useCallback(() => {
    clearVolumeHideTimer();
    setVolumeTrayOpen(true);
  }, [clearVolumeHideTimer]);

  const scheduleVolumeTrayClose = useCallback(
    (delay = 800) => {
      clearVolumeHideTimer();
      volumeHideTimerRef.current = window.setTimeout(() => {
        setVolumeTrayOpen(false);
        volumeHideTimerRef.current = null;
      }, delay);
    },
    [clearVolumeHideTimer]
  );
  const handleNavigateToProfile = useCallback(() => {
    if (!authorProfileHref) return;
    router.push(authorProfileHref);
  }, [authorProfileHref, router]);
  const handleNavigateToOrganization = useCallback(
    (organizationId: string) => {
      if (!organizationId) return;
      router.push(`/organization/${organizationId}`);
    },
    [router]
  );

  const closeOrgPicker = useCallback(() => {
    setOrgPickerOpen(false);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!orgPickerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeOrgPicker();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [orgPickerOpen, closeOrgPicker]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('[aria-label="เมนูเพิ่มเติม"]') &&
        !target.closest(".absolute.right-0")
      ) {
        closeMenu();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClickOutside);
    };
  }, [menuOpen, closeMenu]);

  const handleFollowToggle = useCallback(async () => {
    if (
      !authorUserId ||
      authorUserId === currentUserId ||
      followBusy ||
      !followLoaded
    ) {
      return;
    }
    const action = isFollowing ? "unfollow" : "follow";
    try {
      setFollowBusy(true);
      setFollowError(null);
      await followUser({
        targetUserId: authorUserId,
        action,
      });
      setIsFollowingAuthor(action === "follow");
    } catch (error: unknown) {
      setFollowError(
        error instanceof Error
          ? error.message
          : "ไม่สามารถอัปเดตสถานะการติดตามได้"
      );
    } finally {
      setFollowBusy(false);
    }
  }, [authorUserId, currentUserId, followBusy, followLoaded, isFollowing]);

  const handleDeleteVideo = useCallback(async () => {
    if (!post.id || deleteLoading) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await deleteVideo(post.id);

      // Close modal and menu, then redirect to main feed
      setShowDeleteModal(false);
      setMenuOpen(false);
      router.push("/");
    } catch (error: unknown) {
      setDeleteError(
        error instanceof Error ? error.message : "ไม่สามารถลบวิดีโอได้"
      );
    } finally {
      setDeleteLoading(false);
    }
  }, [post.id, deleteLoading, router]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    const loadFollowState = async () => {
      if (!normalizedHandle) {
        setAuthorUserId(null);
        setIsFollowingAuthor(null);
        setFollowLoaded(true);
        return;
      }

      setFollowLoaded(false);
      setFollowError(null);

      let userId: string | null = null;
      const cachedUserId = handleLookupCache.get(normalizedHandle);

      if (cachedUserId !== undefined) {
        userId = cachedUserId;
      } else {
        try {
          const lookup = await getUserIdByHandle(normalizedHandle, {
            signal: ctrl.signal,
          });
          if (cancelled) return;
          userId = lookup?.userId ?? null;
          handleLookupCache.set(normalizedHandle, userId);
        } catch (error: unknown) {
          if (cancelled) return;
          const err = error as { name?: string; message?: string };
          if (err?.name === "AbortError") return;
          setAuthorUserId(null);
          setIsFollowingAuthor(null);
          setFollowError(
            error instanceof Error
              ? error.message
              : "ไม่สามารถดึงข้อมูลการติดตามได้"
          );
          setFollowLoaded(true);
          return;
        }
      }

      if (cancelled) return;

      setAuthorUserId(userId);

      if (!userId) {
        setIsFollowingAuthor(null);
        setFollowLoaded(true);
        return;
      }

      if (currentUserId && userId === currentUserId) {
        setIsFollowingAuthor(null);
        setFollowLoaded(true);
        return;
      }

      try {
        const profile = await getUserProfile(userId, {
          signal: ctrl.signal,
        });
        if (cancelled) return;
        setIsFollowingAuthor(Boolean(profile?.is_following));
        setFollowLoaded(true);
      } catch (error: unknown) {
        if (cancelled) return;
        const err = error as { name?: string; message?: string };
        if (err?.name === "AbortError") return;
        setIsFollowingAuthor(false);
        setFollowError(
          error instanceof Error
            ? error.message
            : "ไม่สามารถเช็กสถานะการติดตามได้"
        );
        setFollowLoaded(true);
      }
    };

    void loadFollowState();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [currentUserId, normalizedHandle]);

  useEffect(() => {
    const rawIds = Array.isArray(post.orgViewIds) ? post.orgViewIds : [];
    const uniqueIds = Array.from(
      new Set(
        rawIds.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0
        )
      )
    );

    if (uniqueIds.length === 0) {
      lastOrgIdsKeyRef.current = "";
      setOrgDetails([]);
      setOrgError(null);
      setOrgLoading(false);
      return;
    }

    if (!shouldLoad) {
      setOrgLoading(false);
      return;
    }

    const idsKey = uniqueIds.join("|");
    if (idsKey === lastOrgIdsKeyRef.current) {
      return;
    }

    const cached = uniqueIds
      .map((id) => organizationDetailCache.get(id))
      .filter((org): org is Organization => Boolean(org));

    if (cached.length === uniqueIds.length) {
      setOrgDetails(cached);
      setOrgError(null);
      setOrgLoading(false);
      lastOrgIdsKeyRef.current = idsKey;
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const load = async () => {
      setOrgLoading(true);
      setOrgError(null);
      try {
        const results: Organization[] = [];
        for (const id of uniqueIds) {
          const cachedOrg = organizationDetailCache.get(id);
          if (cachedOrg) {
            results.push(cachedOrg);
            continue;
          }
          const org = await getOrganizationDetail(id, { signal: ctrl.signal });
          organizationDetailCache.set(id, org);
          results.push(org);
        }
        if (cancelled) return;
        setOrgDetails(results);
        setOrgError(null);
        lastOrgIdsKeyRef.current = idsKey;
      } catch (error: unknown) {
        if (cancelled) return;
        const err = error as { name?: string; message?: string };
        if (err?.name === "AbortError") return;
        setOrgError(
          error instanceof Error ? error.message : "ไม่สามารถดึงข้อมูลองค์กรได้"
        );
        console.error("[VideoCard] Failed to load organization details", error);
        setOrgDetails([]);
        lastOrgIdsKeyRef.current = "";
      } finally {
        if (!cancelled) {
          setOrgLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [post.orgViewIds, shouldLoad]);

  useEffect(() => {
    if (!orgPickerOpen) return;
    if (orgDetails.length <= 1 || orgError || !hasOrganizationVisibility) {
      setOrgPickerOpen(false);
    }
  }, [hasOrganizationVisibility, orgDetails.length, orgError, orgPickerOpen]);

  const handleVolumeChange = useCallback(
    (value: number) => {
      dispatch(setVolume(value));
    },
    [dispatch]
  );

  const setVolumeFromClientY = useCallback(
    (clientY: number) => {
      const bar = volumeBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      if (rect.height <= 0) return;
      const ratio = clamp01((rect.bottom - clientY) / rect.height);
      handleVolumeChange(ratio);
      openVolumeTray();
    },
    [handleVolumeChange, openVolumeTray]
  );

  const handleVolumePointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse") {
        openVolumeTray();
      }
    },
    [openVolumeTray]
  );

  const handleVolumePointerLeave = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && !isAdjustingVolume) {
        scheduleVolumeTrayClose(300);
      }
    },
    [isAdjustingVolume, scheduleVolumeTrayClose]
  );

  const handleVolumeButtonPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (e.pointerType !== "mouse") {
        openVolumeTray();
        scheduleVolumeTrayClose(2000);
      }
    },
    [openVolumeTray, scheduleVolumeTrayClose]
  );

  const handleSliderPointerDown = useCallback(
    (pointerType: string) => {
      setIsAdjustingVolume(true);
      openVolumeTray();
      if (pointerType !== "mouse") {
        scheduleVolumeTrayClose(2000);
      }
    },
    [openVolumeTray, scheduleVolumeTrayClose]
  );

  const handleSliderPointerUp = useCallback(
    (pointerType?: string) => {
      setIsAdjustingVolume(false);
      const delay = pointerType === "mouse" ? 400 : 1500;
      scheduleVolumeTrayClose(delay);
    },
    [scheduleVolumeTrayClose]
  );

  // Track latest isActive in a ref to avoid stale closures in event handlers
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => startAccumulatingWatch();
    const handlePlaying = () => startAccumulatingWatch();
    const handlePause = () => stopAccumulatingWatch();
    const handleWaiting = () => stopAccumulatingWatch();
    const handleEnded = () => stopAccumulatingWatch();

    video.addEventListener("play", handlePlay);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("ended", handleEnded);

    if (isActiveRef.current && !video.paused && !video.ended) {
      startAccumulatingWatch();
    }

    return () => {
      stopAccumulatingWatch();
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("ended", handleEnded);
    };
  }, [post.videoSrc, startAccumulatingWatch, stopAccumulatingWatch]);

  // Reset preload state when the source changes
  useEffect(() => {
    preloadDoneRef.current = false;
    setVideoReady(false);
    setUsePosterBg(true);
  }, [post.videoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    v.volume = Math.max(0, Math.min(1, volume));
    // Background video stays muted regardless
    const bg = bgVideoRef.current;
    if (bg) bg.muted = true;
  }, [muted, volume]);

  // When becoming active, ensure playhead starts from 0 even if preloading advanced it
  useEffect(() => {
    if (!isActive) return;
    const v = videoRef.current;
    if (!v) return;
    try {
      if (isFinite(v.currentTime) && v.currentTime > 0.05) {
        v.currentTime = 0;
      }
    } catch {}
  }, [isActive, post.videoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    const bg = bgVideoRef.current;
    if (!v) return;
    const shouldPlay = isActive && playing;
    if (shouldPlay) {
      const playPromise = v.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
      if (bg) {
        const p2 = bg.play();
        if (p2 && typeof p2.catch === "function") p2.catch(() => {});
      }
    } else {
      v.pause();
      if (bg) bg.pause();
    }
  }, [playing, isActive]);

  useEffect(
    () => () => {
      clearVolumeHideTimer();
    },
    [clearVolumeHideTimer]
  );

  useEffect(() => {
    if (!isActive) {
      clearVolumeHideTimer();
      setVolumeTrayOpen(false);
      setIsAdjustingVolume(false);
    }
  }, [isActive, clearVolumeHideTimer]);

  // Ensure mute state matches global when becoming active (may override preload's temp mute)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      try {
        v.muted = muted;
      } catch {}
    }
  }, [isActive, muted]);

  // Link background <video> to the primary video stream to avoid double network load.
  // On platforms without captureStream (iOS Safari), fall back to the poster background.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const bg = bgVideoRef.current;

    // If we are not loading or not active, prefer poster and clear any linked stream
    if (!shouldLoad || !isActive) {
      setUsePosterBg(true);
      try {
        if (bg && bg.srcObject) bg.srcObject = null;
      } catch {}
      return;
    }

    // Feature detection: captureStream is not supported on many mobile browsers
    const captureCandidate = v as VideoWithCapture;
    const supportsCapture =
      typeof captureCandidate.captureStream === "function" ||
      typeof captureCandidate.mozCaptureStream === "function";
    if (!supportsCapture) {
      setUsePosterBg(true);
      return;
    }

    let cancelled = false;
    const onBgCanShow = (event?: Event) => {
      void event;
      if (cancelled) return;
      setUsePosterBg(false);
    };

    const link = () => {
      if (cancelled) return;
      if (!bg) return;
      try {
        const stream: MediaStream | undefined =
          captureCandidate.captureStream?.() ||
          captureCandidate.mozCaptureStream?.();
        if (stream) {
          try {
            bg.srcObject = stream;
            // Wait until background video is actually able to render frames
            // before hiding the poster blur, to avoid a flash of black.
            if (bg.readyState >= 2) {
              onBgCanShow();
            } else {
              bg.addEventListener("loadeddata", onBgCanShow as EventListener);
              bg.addEventListener("canplay", onBgCanShow as EventListener);
              bg.addEventListener("playing", onBgCanShow as EventListener);
            }
          } catch {
            setUsePosterBg(true);
          }
        } else {
          setUsePosterBg(true);
        }
      } catch {
        setUsePosterBg(true);
      }
    };

    if (v.readyState >= 1) link();
    else v.addEventListener("loadedmetadata", link);

    return () => {
      cancelled = true;
      v.removeEventListener("loadedmetadata", link as EventListener);
      if (bg) {
        try {
          bg.srcObject = null;
        } catch {}
        bg.removeEventListener("loadeddata", onBgCanShow as EventListener);
        bg.removeEventListener("canplay", onBgCanShow as EventListener);
        bg.removeEventListener("playing", onBgCanShow as EventListener);
      }
    };
  }, [post.videoSrc, shouldLoad, isActive]);

  useEffect(() => {
    const v = videoRef.current;
    const bg = bgVideoRef.current;
    if (!v) return;

    let rafId: number | null = null;
    const syncBgTime = () => {
      const b = bgVideoRef.current;
      if (!b || b.srcObject || !v || !isFinite(v.currentTime)) return;
      try {
        if (Math.abs((b.currentTime || 0) - v.currentTime) > 0.2) {
          b.currentTime = v.currentTime;
        }
      } catch {}
    };
    const onTime = () => {
      const ratio = v.duration ? v.currentTime / v.duration : 0;
      const clamped = Math.max(0, Math.min(1, ratio));
      const el = progressInnerRef.current;
      if (el) {
        if (rafId == null) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            el.style.transform = `scaleX(${clamped})`;
            lastProgressRef.current = clamped;
          });
        }
      }
      syncBgTime();
    };
    const onSeeked = () => syncBgTime();
    const onBgLoaded = () => syncBgTime();

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onTime);
    v.addEventListener("seeked", onSeeked);
    bg?.addEventListener("loadedmetadata", onBgLoaded);
    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onTime);
      v.removeEventListener("seeked", onSeeked);
      bg?.removeEventListener("loadedmetadata", onBgLoaded);
    };
  }, [usePosterBg]);

  // Maintain preview canvas size according to video aspect ratio
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const update = () => {
      const vw = v.videoWidth || 9;
      const vh = v.videoHeight || 16;
      const targetW = 140; // px
      const targetH = Math.max(80, Math.round((targetW * vh) / vw));
      setPreviewSize({ w: targetW, h: targetH });
      const c = previewCanvasRef.current;
      if (c) {
        c.width = targetW;
        c.height = targetH;
      }
    };
    update();
    v.addEventListener("loadedmetadata", update);
    v.addEventListener("resize", update as EventListener);
    return () => {
      v.removeEventListener("loadedmetadata", update);
      v.removeEventListener("resize", update as EventListener);
    };
  }, [post.videoSrc]);

  // Lazy-init preview video element to avoid extra network until needed
  const ensurePreviewVideo = useCallback(() => {
    if (previewVideoRef.current) return previewVideoRef.current;
    const v = document.createElement("video");
    v.crossOrigin = "use-credentials";
    v.playsInline = true;
    v.preload = "metadata";
    v.muted = true;
    v.src = post.videoSrc;
    previewVideoRef.current = v;
    return v;
  }, [post.videoSrc]);

  const drawPreview = useCallback(
    (time: number) => {
      const now = Date.now();
      // Throttle seeks to ~30fps while dragging
      if (now - lastPreviewRequestRef.current < 30) {
        pendingSeekRef.current = time;
        return;
      }
      lastPreviewRequestRef.current = now;

      const pv = ensurePreviewVideo();
      const canvas = previewCanvasRef.current;
      if (!pv || !canvas) return;

      const doDraw = () => {
        try {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const { w, h } = previewSize;
          ctx.clearRect(0, 0, w, h);
          const vw = pv.videoWidth || 9;
          const vh = pv.videoHeight || 16;
          // Contain into preview box
          const scale = Math.min(w / vw, h / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          const dx = (w - dw) / 2;
          const dy = (h - dh) / 2;
          ctx.drawImage(pv, dx, dy, dw, dh);
        } catch {
          // Drawing cross-origin videos may taint canvas; we don't read pixels, so ignore errors
        }
      };

      const onSeeked = () => {
        pv.removeEventListener("seeked", onSeeked);
        doDraw();
        // If another seek was queued while we waited, process it now
        if (pendingSeekRef.current != null) {
          const t = pendingSeekRef.current;
          pendingSeekRef.current = null;
          drawPreview(t!);
        }
      };

      // If metadata not ready, wait for it first
      if (pv.readyState < 1) {
        const onMeta = () => {
          pv.removeEventListener("loadedmetadata", onMeta);
          pv.currentTime = Math.max(
            0,
            Math.min(time, (pv.duration || 0) - 0.001)
          );
        };
        pv.addEventListener("loadedmetadata", onMeta);
        pv.load();
      }

      pv.addEventListener("seeked", onSeeked);
      try {
        pv.currentTime = Math.max(
          0,
          Math.min(time, (pv.duration || 0) - 0.001)
        );
      } catch {
        pv.removeEventListener("seeked", onSeeked);
      }
    },
    [ensurePreviewVideo, previewSize]
  );

  const clientXToRatio = useCallback((clientX: number) => {
    const bar = progressBarRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return clamp01((clientX - rect.left) / Math.max(1, rect.width));
  }, []);

  const beginScrub = useCallback(
    (ratio: number) => {
      const v = videoRef.current;
      if (!v) return;
      playingBeforeScrubRef.current = playing;
      setIsScrubbing(true);
      setPlaying(false);
      const dur = isFinite(v.duration) ? v.duration : 0;
      const t = dur * ratio;
      setPreviewTime(t);
      setHoverRatio(ratio);
      drawPreview(t);
    },
    [drawPreview, playing]
  );

  const updateScrub = useCallback(
    (ratio: number) => {
      const v = videoRef.current;
      if (!v) return;
      const dur = isFinite(v.duration) ? v.duration : 0;
      const t = dur * ratio;
      setPreviewTime(t);
      setHoverRatio(ratio);
      drawPreview(t);
    },
    [drawPreview]
  );

  const endScrub = useCallback(
    (ratio?: number) => {
      const v = videoRef.current;
      if (!v) return;
      const r = ratio != null ? ratio : hoverRatio ?? lastProgressRef.current;
      const dur = isFinite(v.duration) ? v.duration : 0;
      const t = dur * clamp01(r ?? 0);
      try {
        if (isFinite(t) && t >= 0) v.currentTime = t;
      } catch {}
      setIsScrubbing(false);
      setHoverRatio(null);
      setPreviewTime(null);
      if (playingBeforeScrubRef.current) setPlaying(true);
    },
    [hoverRatio]
  );

  // Attach pointer listeners during active scrubbing for outside moves
  useEffect(() => {
    if (!isScrubbing) return;
    const onMove = (e: PointerEvent) => {
      const ratio = clientXToRatio(e.clientX);
      updateScrub(ratio);
    };
    const onUp = (e: PointerEvent) => {
      const ratio = clientXToRatio(e.clientX);
      endScrub(ratio);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isScrubbing, clientXToRatio, updateScrub, endScrub]);

  useEffect(() => {
    if (!isAdjustingVolume) return;
    const onMove = (e: PointerEvent) => {
      setVolumeFromClientY(e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      setVolumeFromClientY(e.clientY);
      handleSliderPointerUp(e.pointerType);
      if (
        volumePointerIdRef.current != null &&
        e.pointerId === volumePointerIdRef.current
      ) {
        volumeBarRef.current?.releasePointerCapture?.(e.pointerId);
        volumePointerIdRef.current = null;
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isAdjustingVolume, handleSliderPointerUp, setVolumeFromClientY]);

  // Track when the primary video is actually ready to render frames.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const markReady = () => setVideoReady(true);
    const resetReady = () => setVideoReady(false);

    // If it already has data (e.g., preloaded), mark ready.
    if (v.readyState >= 2) setVideoReady(true);
    else setVideoReady(false);

    v.addEventListener("loadeddata", markReady);
    v.addEventListener("canplay", markReady);
    v.addEventListener("playing", markReady);
    v.addEventListener("emptied", resetReady);
    v.addEventListener("abort", resetReady);
    v.addEventListener("error", resetReady);

    return () => {
      v.removeEventListener("loadeddata", markReady);
      v.removeEventListener("canplay", markReady);
      v.removeEventListener("playing", markReady);
      v.removeEventListener("emptied", resetReady);
      v.removeEventListener("abort", resetReady);
      v.removeEventListener("error", resetReady);
    };
  }, [post.videoSrc]);

  // When card becomes inactive and not preloading, ensure it stops and unloads
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = isActive;

    if (wasActive && !isActive) {
      emitWatchTime();
      const v = videoRef.current;
      if (v) {
        try {
          v.currentTime = 0;
        } catch {}
      }
      watchAccumulatorRef.current = 0;
      watchStartTimestampRef.current = null;
    } else if (!wasActive && isActive) {
      watchAccumulatorRef.current = 0;
      watchStartTimestampRef.current = null;
      const v = videoRef.current;
      if (v && !v.paused && !v.ended) {
        startAccumulatingWatch();
      }
    }

    if (!isActive && !shouldPreload) {
      const v = videoRef.current;
      const bg = bgVideoRef.current;
      try {
        if (v) {
          v.pause();
          v.removeAttribute("src");
          v.load();
        }
        if (bg) bg.srcObject = null;
      } catch {}
      setUsePosterBg(true);
    }
  }, [emitWatchTime, isActive, shouldPreload, startAccumulatingWatch]);

  // Note: preloading handled via props; unload handled above when not active and not preloading

  // Approximate partial preload: when shouldPreload is true (but not active),
  // briefly play muted to buffer up to preloadSeconds, then pause and reset to 0.
  useEffect(() => {
    if (!shouldPreload || isActive) return;
    const v = videoRef.current;
    if (!v) return;
    if (preloadDoneRef.current) return;

    let cancelled = false;
    let played = false;

    const maybeStart = () => {
      if (!v || cancelled || preloadDoneRef.current) return;
      try {
        // Ensure muted for autoplay policies
        v.muted = true;
        // Encourage buffering; playback will fetch regardless of preload attr
        const p = v.play();
        played = true;
        if (p && typeof p.catch === "function") {
          p.catch(() => {});
        }
      } catch {}
    };

    const onMeta = () => maybeStart();
    const onCanPlay = () => maybeStart();
    const onTime = () => {
      if (!v || cancelled || !played) return;
      // If card became active, do not interfere with playback
      if (isActiveRef.current) return;
      if (!isFinite(preloadSeconds) || preloadSeconds <= 0) return;
      if (v.currentTime >= preloadSeconds) {
        try {
          v.pause();
          // Reset to start so when activated it starts from 0, keeping buffer
          v.currentTime = 0;
        } catch {}
        preloadDoneRef.current = true;
        // Once done, stop listening to avoid races
        v.removeEventListener("timeupdate", onTime);
        v.removeEventListener("loadedmetadata", onMeta);
        v.removeEventListener("canplay", onCanPlay);
      }
    };

    // If metadata is already available, try immediately
    if (v.readyState >= 1) maybeStart();
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("timeupdate", onTime);

    return () => {
      cancelled = true;
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [shouldPreload, isActive, preloadSeconds, post.videoSrc]);

  useEffect(() => {
    return () => {
      stopAccumulatingWatch();
      if (prevActiveRef.current) {
        emitWatchTime();
      }
    };
  }, [emitWatchTime, stopAccumulatingWatch]);

  // Ambient color sampler (YouTube-like)
  useEffect(() => {
    if (!isActive) return;
    const v = videoRef.current;
    if (!v) return;

    // Create (or reuse) a tiny offscreen canvas
    if (!samplerCanvasRef.current) {
      samplerCanvasRef.current = document.createElement("canvas");
    }
    const c = samplerCanvasRef.current;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const sample = () => {
      if (!v.videoWidth || !v.videoHeight) return;
      // Keep a tiny resolution to keep it cheap
      const targetW = 32;
      const aspect = v.videoHeight / v.videoWidth || 9 / 16;
      const targetH = Math.max(8, Math.round(targetW * aspect));
      c.width = targetW;
      c.height = targetH;
      try {
        ctx.drawImage(v, 0, 0, targetW, targetH);
        const img = ctx.getImageData(0, 0, targetW, targetH);
        const data = img.data;
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        // Sample every Nth pixel to be extra cheap
        const step = 4 * 2; // every 2px
        for (let i = 0; i < data.length; i += step) {
          const cr = data[i];
          const cg = data[i + 1];
          const cb = data[i + 2];
          const ca = data[i + 3];
          if (ca < 16) continue; // skip nearly transparent
          r += cr;
          g += cg;
          b += cb;
          count++;
        }
        if (!count) return;
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        // Slightly desaturate and darken for a subtle glow
        const desat = 3; // 1 = original
        const avg = (r + g + b) / 3;
        r = Math.round(r * desat + avg * (1 - desat));
        g = Math.round(g * desat + avg * (1 - desat));
        b = Math.round(b * desat + avg * (1 - desat));
        // Mix with base dark to avoid overpowering UI
        const mix = 0.7; // closer to dark
        const base = 10; // ~neutral-950
        r = Math.round(r * (1 - mix) + base * mix);
        g = Math.round(g * (1 - mix) + base * mix);
        b = Math.round(b * (1 - mix) + base * mix);
        const color = `rgb(${r}, ${g}, ${b})`;
        if (color !== lastSentColorRef.current) {
          lastSentColorRef.current = color;
          dispatch(setAmbientColor(color));
        }
      } catch {
        // ignore drawImage security errors if any
      }
    };

    // Sample initially once metadata is ready, then on an interval while active
    const onReady = () => sample();
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("loadedmetadata", onReady);
    // Throttle to about once per 1500ms for perf
    const id = window.setInterval(sample, 1500);

    // Also sample when playhead is scrubbed noticeably
    const onSeeked = () => sample();
    v.addEventListener("seeked", onSeeked);

    return () => {
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("loadedmetadata", onReady);
      v.removeEventListener("seeked", onSeeked);
      window.clearInterval(id);
    };
  }, [isActive, dispatch]);

  return (
    <>
      <article className="relative w-full h-full sm:rounded-2xl overflow-hidden bg-neutral-900 border border-white/10">
        {/* Blurred video background to avoid black bars while preserving aspect ratio */}
        {/* Show blurred poster while background not ready, unsupported, or main video not ready */}
        <div
          aria-hidden
          className={`absolute inset-0 z-0 w-full h-full bg-center bg-cover scale-110 pointer-events-none ${
            usePosterBg || !videoReady ? "" : "hidden"
          } blur-2xl`}
          style={{ backgroundImage: `url(${post.thumbnail})` }}
        />
        <video
          ref={bgVideoRef}
          className={`absolute inset-0 z-0 w-full h-full object-cover scale-110 pointer-events-none ${
            usePosterBg || !videoReady ? "hidden" : "blur-2xl"
          }`}
          crossOrigin="use-credentials"
          playsInline
          muted
          loop
          autoPlay={isActive && playing}
          aria-hidden
        />
        {/* Crisp poster overlay for main video until it’s ready */}
        {!videoReady && (
          <Image
            aria-hidden
            className="absolute inset-0 z-20 w-full h-full object-contain pointer-events-none"
            src={post.thumbnail}
            alt="Video placeholder"
            fill
            sizes="100vw"
            unoptimized
          />
        )}
        <video
          ref={videoRef}
          className="relative z-10 object-contain w-full h-full"
          crossOrigin="use-credentials"
          src={shouldLoad ? post.videoSrc : undefined}
          preload={isActive ? "auto" : shouldPreload ? "metadata" : "none"}
          poster={post.thumbnail}
          loop
          playsInline
          muted={muted}
          autoPlay={isActive && playing}
          onClick={() => isActive && setPlaying((v) => !v)}
        />

        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute left-2 sm:left-4 bottom-20 sm:bottom-24 space-y-2 max-w-[80%] z-30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNavigateToProfile}
              disabled={!authorProfileHref}
              className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-70 pointer-events-auto"
            >
              <Image
                src={post.user.avatar}
                alt={`ภาพโปรไฟล์ของ ${post.user.name}`}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border border-white/10 cursor-pointer"
                unoptimized
              />
              <span className="text-left">
                <span className="block font-semibold leading-tight cursor-pointer w-fit">
                  {post.user.name}
                </span>
                <span className="block text-xs text-white/60 leading-tight cursor-pointer">
                  {post.user.handle}
                </span>
              </span>
            </button>
            {showFollowButton ? (
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={!followLoaded || followBusy}
                className={`${followButtonClasses} pointer-events-auto ${
                  !followLoaded || followBusy
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {followBusy ? "..." : isFollowing ? "กำลังติดตาม" : "ติดตาม"}
              </button>
            ) : null}
          </div>
          {followError ? (
            <p className="text-xs text-red-400">{followError}</p>
          ) : null}
          <p className="text-sm leading-snug">
            {post.caption}{" "}
            <span className="text-white/60">{post.tags.join(" ")}</span>
          </p>
        </div>

        <div className="absolute right-2 sm:right-4 top-2 sm:top-4 flex items-center gap-2 z-30">
          <div
            className="relative"
            onPointerEnter={handleVolumePointerEnter}
            onPointerLeave={handleVolumePointerLeave}
          >
            <button
              onClick={() => dispatch(toggleMuted())}
              onPointerDown={handleVolumeButtonPointerDown}
              className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 hover:bg-black/60"
              aria-label={globalMuted ? "เปิดเสียงวิดีโอ" : "ปิดเสียงวิดีโอ"}
            >
              {globalMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <div
              className={`absolute right-0 mt-2 w-44 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl transition-all duration-200 ease-out backdrop-blur-sm ${
                volumeTrayOpen
                  ? "pointer-events-auto opacity-100 translate-y-0"
                  : "pointer-events-none opacity-0 translate-y-1"
              }`}
            >
              <div className="flex items-end gap-4">
                <div
                  ref={volumeBarRef}
                  className="relative h-32 w-12 cursor-pointer"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    volumePointerIdRef.current = e.pointerId;
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    handleSliderPointerDown(e.pointerType);
                    setVolumeFromClientY(e.clientY);
                  }}
                >
                  <div className="absolute inset-0 rounded-3xl border border-white/10 bg-white/5" />
                  <div className="absolute inset-x-[9px] top-3 bottom-3 rounded-full bg-white/12 overflow-hidden">
                    <div
                      className="absolute inset-x-0 bottom-0 h-full origin-bottom rounded-full bg-gradient-to-t from-white via-white to-white/70"
                      style={{ transform: `scaleY(${sliderRatio})` }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_75%)]" />
                  </div>
                  <div
                    className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-black/30 bg-white shadow-[0_6px_16px_rgba(0,0,0,0.55)]"
                    style={{
                      bottom: `calc(${sliderRatio} * (100% - 24px) + 12px)`,
                    }}
                  />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                    ระดับเสียง
                  </span>
                  <span className="text-base font-semibold text-white">
                    {sliderValue}%
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sliderValue}
                aria-label="ระดับเสียง"
                className="sr-only"
                onChange={(e) => {
                  const next = Number(e.target.value) / 100;
                  handleVolumeChange(next);
                  openVolumeTray();
                }}
                onFocus={() => openVolumeTray()}
                onBlur={() => scheduleVolumeTrayClose(400)}
              />
              <p className="mt-2 text-[11px] text-white/55">
                ลากหรือแตะตัวเลื่อนเพื่อปรับระดับเสียง
              </p>
            </div>
          </div>
          <button
            onClick={() => isActive && setPlaying((v) => !v)}
            className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 hover:bg-black/60 disabled:opacity-50"
            disabled={!isActive}
          >
            {playing ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          {isOwnPost && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 hover:bg-black/60"
                aria-label="เมนูเพิ่มเติม"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-sm overflow-hidden">
                  <button
                    onClick={handleDeleteClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">ลบวิดีโอ</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <ActionRail
          postId={post.id}
          interactions={post.interactions}
          comments={post.comments}
          saves={post.saves}
          viewerReaction={post.viewer?.reaction ?? null}
          viewerSaved={post.viewer?.saved ?? null}
        />
        {hasOrganizationVisibility ? (
          <div className="pointer-events-none absolute left-2 sm:left-4 bottom-4 pr-20 z-30">
            <div className="pointer-events-auto flex max-w-[78vw] sm:max-w-md items-center gap-2 rounded-full border border-white/12 bg-black/55 px-3 py-1.5 text-xs sm:text-sm backdrop-blur">
              {orgLoading ? (
                <span className="flex items-center gap-2 text-white/70">
                  <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white/35 border-t-transparent" />
                  <span>กำลังโหลดองค์กร...</span>
                </span>
              ) : orgError ? (
                <span className="text-red-300">โหลดข้อมูลองค์กรไม่สำเร็จ</span>
              ) : primaryOrganization ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleNavigateToOrganization(primaryOrganization._id)
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    title={primaryOrganization.name}
                  >
                    <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/40">
                      {primaryOrganization.logo_url ? (
                        <Image
                          src={primaryOrganization.logo_url}
                          alt={`โลโก้องค์กร ${primaryOrganization.name}`}
                          width={24}
                          height={24}
                          className="h-6 w-6 object-cover"
                          unoptimized
                        />
                      ) : (
                        <Building2 className="h-4 w-4 text-white/75" />
                      )}
                    </span>
                    <span className="max-w-[140px] truncate text-white">
                      {primaryOrganization.name}
                    </span>
                  </button>
                  {extraOrganizationCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setOrgPickerOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-white/80 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      aria-label={`ดูองค์กรอื่นอีก ${extraOrganizationCount} แห่ง`}
                    >
                      +{extraOrganizationCount}
                    </button>
                  ) : null}
                </>
              ) : (
                <span className="text-white/70">แชร์กับองค์กร</span>
              )}
            </div>
          </div>
        ) : null}
        {orgPickerOpen && remainingOrganizations.length > 0 ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div
              className="pointer-events-auto absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closeOrgPicker}
              aria-hidden="true"
            />
            <div className="pointer-events-auto relative z-10 w-[88%] max-w-[360px] rounded-3xl border border-white/12 bg-black/75 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">
                  เลือกองค์กร
                </h3>
                <button
                  type="button"
                  onClick={closeOrgPicker}
                  className="rounded-full border border-white/10 bg-white/10 p-1 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  aria-label="ปิดรายการองค์กร"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
              <p className="mt-1 text-sm text-white/60">
                เลือกองค์กรเพื่อเปิดดูฟีด
              </p>
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                {orgDetails.map((org) => (
                  <button
                    key={org._id}
                    type="button"
                    onClick={() => {
                      closeOrgPicker();
                      handleNavigateToOrganization(org._id);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/40">
                      {org.logo_url ? (
                        <Image
                          src={org.logo_url}
                          alt={`โลโก้องค์กร ${org.name}`}
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover"
                          unoptimized
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-white/75" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {org.name}
                      </p>
                      {org.domains && org.domains.length > 0 ? (
                        <p className="truncate text-xs text-white/50">
                          {org.domains[0]}
                          {org.domains.length > 1
                            ? " +" + (org.domains.length - 1)
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-xs font-medium text-white/60">
                      ดูฟีด
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Scrubbable progress bar + thumbnail preview */}
        <div
          ref={progressBarRef}
          className="absolute left-0 right-0 bottom-0 h-6 z-30 overflow-visible cursor-pointer touch-none"
          onPointerDown={(e) => {
            // Only left button or touch
            if (typeof e.button === "number" && e.button !== 0) return;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            const ratio = clientXToRatio(e.clientX);
            beginScrub(ratio);
          }}
          onPointerMove={(e) => {
            const ratio = clientXToRatio(e.clientX);
            setHoverRatio(ratio);
            if (!isScrubbing) return;
            const v = videoRef.current;
            if (!v) return;
            const dur = isFinite(v.duration) ? v.duration : 0;
            const t = dur * ratio;
            setPreviewTime(t);
            drawPreview(t);
          }}
          onPointerLeave={() => {
            setHoverRatio(null);
          }}
          onPointerUp={(e) => {
            if (!isScrubbing) return;
            (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
            const ratio = clientXToRatio(e.clientX);
            endScrub(ratio);
          }}
        >
          {/* Thin visible track anchored to bottom; larger wrapper keeps touch target comfortable */}
          <div className="absolute left-0 right-0 bottom-0 h-0.5 sm:h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              ref={progressInnerRef}
              className="h-full bg-white/80 will-change-transform origin-left"
              style={{ transform: "scaleX(0)" }}
            />
          </div>

          {/* Hover/drag preview bubble */}
          {isScrubbing && hoverRatio != null && (
            <div
              className="absolute bottom-full mb-2 px-1 py-1 rounded-md bg-black/80 border border-white/10 shadow-lg backdrop-blur-sm select-none"
              style={{
                left: `${(hoverRatio || 0) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <canvas
                ref={previewCanvasRef}
                width={previewSize.w}
                height={previewSize.h}
                style={{
                  width: previewSize.w,
                  height: previewSize.h,
                  display: "block",
                }}
              />
              {previewTime != null && (
                <div className="text-[10px] leading-none text-white/80 text-center mt-1">
                  {(() => {
                    const t = Math.max(0, Math.floor(previewTime || 0));
                    const mm = Math.floor(t / 60)
                      .toString()
                      .padStart(2, "0");
                    const ss = (t % 60).toString().padStart(2, "0");
                    return `${mm}:${ss}`;
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Off-DOM hidden preview <video> is created lazily. No JSX element needed. */}
      </article>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteVideo}
        title="ลบวิดีโอ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
        type="confirm"
        confirmText={deleteLoading ? "กำลังลบ..." : "ลบวิดีโอ"}
        cancelText="ยกเลิก"
      />

      {/* Error modal */}
      {deleteError && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteError(null)}
          title="เกิดข้อผิดพลาด"
          message={deleteError}
          type="error"
          confirmText="ตกลง"
        />
      )}
    </>
  );
}
