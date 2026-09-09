"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Bookmark,
  Heart,
  Maximize,
  Minimize,
  MessageCircle,
  Share2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Sheet, SheetContent, SheetTitle } from "@skilltego/ui";
import { cn, initials } from "@skilltego/utils";
import type { Post } from "@skilltego/types";
import { toggleLikeAction, toggleSaveAction } from "@/features/posts/actions";
import { CommentThread } from "@/features/posts/components/comment-thread";
import { useSharePost } from "@/features/posts/hooks/use-share-post";
import { useActiveVideoStore } from "@/lib/active-video-store";

interface ReelPlayerProps {
  post: Post;
  isLoggedIn: boolean;
  currentUserId: string | null;
  muted: boolean;
  onToggleMute: () => void;
  /** False for reels scrolled far from view — releases the <video> element (and its decoder/buffer) entirely, keeping just the poster. */
  shouldLoadVideo: boolean;
}

const SKIP_SECONDS = 10;
/** A second tap inside this window counts as a double-tap-to-like instead of the single-tap play/pause toggle. */
const TAP_WINDOW_MS = 250;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ReelPlayer({
  post,
  isLoggedIn,
  currentUserId,
  muted,
  onToggleMute,
  shouldLoadVideo,
}: ReelPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrubBarRef = React.useRef<HTMLDivElement>(null);
  const tapTimerRef = React.useRef<number | null>(null);
  const draggingRef = React.useRef(false);

  const [isLiked, setIsLiked] = React.useState(post.isLiked);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);
  const [isSaved, setIsSaved] = React.useState(post.isSaved);
  const [showComments, setShowComments] = React.useState(false);
  const [commentCount, setCommentCount] = React.useState(post.commentCount);
  const [showHeartBurst, setShowHeartBurst] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const setActiveVideo = useActiveVideoStore((s) => s.setActive);
  const activeVideoId = useActiveVideoStore((s) => s.activeId);
  const { handleShare, linkCopied } = useSharePost(post.id);

  // Observes the container (not the <video> itself) so scrolling toward a
  // reel whose video isn't mounted yet still promotes it into view — see the
  // windowing logic in ReelsFeed, which mounts shouldLoadVideo based on
  // proximity to whichever post this effect claims as active.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActiveVideo(post.id);
        } else if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [post.id, setActiveVideo]);

  // Only the claimed video actually plays — this is what makes cross-component
  // exclusivity (a reel vs. a video a user tapped play on in a post card)
  // actually guaranteed, rather than just an emergent side effect of layout.
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (activeVideoId === post.id) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [activeVideoId, post.id, shouldLoadVideo]);

  React.useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  React.useEffect(() => {
    return () => {
      if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
    };
  }, []);

  async function handleLike() {
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    const result = await toggleLikeAction(post.id, isLiked);
    if (!result.success) {
      setIsLiked(isLiked);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  }

  function handleDoubleTapLike() {
    if (!isLiked) handleLike();
    setShowHeartBurst(true);
    window.setTimeout(() => setShowHeartBurst(false), 650);
  }

  async function handleSave() {
    const next = !isSaved;
    setIsSaved(next);
    const result = await toggleSaveAction(post.id, isSaved);
    if (!result.success) setIsSaved(isSaved);
  }

  function togglePlayPause() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  // A native double-tap fires two `click` events plus a `dblclick` — toggling
  // play/pause twice (a visible flicker) alongside the like. Debouncing a
  // single tap ourselves instead of using onDoubleClick keeps a single tap
  // doing exactly one thing and a double tap doing exactly the other.
  function handleVideoTap() {
    if (tapTimerRef.current) {
      window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      handleDoubleTapLike();
    } else {
      tapTimerRef.current = window.setTimeout(() => {
        tapTimerRef.current = null;
        togglePlayPause();
      }, TAP_WINDOW_MS);
    }
  }

  function skip(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), video.duration || 0);
  }

  function toggleFullscreen() {
    const container = containerRef.current;
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (container?.requestFullscreen) {
      container.requestFullscreen().catch(() => video?.webkitEnterFullscreen?.());
    } else {
      video?.webkitEnterFullscreen?.();
    }
  }

  function seekFromPointer(e: React.PointerEvent<HTMLDivElement>) {
    const bar = scrubBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  }

  function handleScrubPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    seekFromPointer(e);
  }

  function handleScrubPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    e.stopPropagation();
    seekFromPointer(e);
  }

  function handleScrubPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    draggingRef.current = false;
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative flex h-[calc(100dvh-9rem)] w-full snap-start snap-always items-center justify-center overflow-hidden rounded-2xl bg-black md:h-[calc(100dvh-3rem)]"
    >
      {shouldLoadVideo ? (
        <video
          ref={videoRef}
          src={post.media[0]?.url}
          poster={post.thumbnailUrl ?? undefined}
          preload="metadata"
          loop
          muted={muted}
          playsInline
          className="h-full w-full object-contain"
          onClick={handleVideoTap}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
      ) : post.thumbnailUrl ? (
        // Scrolled far enough away that the <video> element (and its decoder/
        // buffer) is unmounted entirely — just the poster stays, at effectively
        // no cost, so scrolling back doesn't show a blank frame while it reloads.
        <Image src={post.thumbnailUrl} alt="" fill className="object-contain" unoptimized />
      ) : (
        <div className="h-full w-full bg-black" />
      )}

      <AnimatePresence>
        {showHeartBurst && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.3, 1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, times: [0, 0.35, 0.8, 1] }}
          >
            <Heart className="size-24 fill-white text-white drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute right-4 top-4 flex gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="rounded-full bg-black/50 p-2 text-white"
        >
          {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="rounded-full bg-black/50 p-2 text-white"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>

      {shouldLoadVideo && duration > 0 && (
        <div className="absolute inset-x-0 bottom-14 z-20 flex items-center gap-2 px-3 text-[10px] text-white">
          <span className="tabular-nums">{formatTime(currentTime)}</span>
          <div
            ref={scrubBarRef}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            className="relative h-4 flex-1 cursor-pointer"
            style={{ touchAction: "none" }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handleScrubPointerDown}
            onPointerMove={handleScrubPointerMove}
            onPointerUp={handleScrubPointerUp}
            onPointerCancel={handleScrubPointerUp}
          >
            <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/30">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <span className="tabular-nums">{formatTime(duration)}</span>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-16 text-white">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-2">
          <Avatar className="size-8 border border-white/40">
            <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.fullName} />
            <AvatarFallback className="text-xs">{initials(post.author.fullName)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold">{post.author.username}</span>
          {post.author.isVerified && <BadgeCheck className="size-3.5 text-primary" />}
        </Link>
        {post.caption && <p className="mt-2 line-clamp-2 text-sm">{post.caption}</p>}
      </div>

      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4 text-white">
        <button
          type="button"
          onClick={() => skip(-SKIP_SECONDS)}
          aria-label={`Rewind ${SKIP_SECONDS} seconds`}
          className="flex flex-col items-center gap-0.5"
        >
          <SkipBack className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => skip(SKIP_SECONDS)}
          aria-label={`Forward ${SKIP_SECONDS} seconds`}
          className="flex flex-col items-center gap-0.5"
        >
          <SkipForward className="size-6" />
        </button>
        <button type="button" onClick={handleLike} className="flex flex-col items-center gap-0.5">
          <Heart className={cn("size-7", isLiked && "fill-current text-destructive")} />
          <span className="text-xs">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-0.5"
        >
          <MessageCircle className="size-7" />
          <span className="text-xs">{commentCount}</span>
        </button>
        <button type="button" onClick={handleShare} className="flex flex-col items-center gap-0.5">
          <Share2 className="size-6" />
        </button>
        <button type="button" onClick={handleSave} className="flex flex-col items-center gap-0.5">
          <Bookmark className={cn("size-7", isSaved && "fill-current text-primary")} />
        </button>
      </div>

      {linkCopied && (
        <div className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
          Link copied
        </div>
      )}

      <Sheet open={showComments} onOpenChange={setShowComments}>
        <SheetContent className="max-h-[75vh] sm:max-h-[80vh]">
          <SheetTitle>Comments</SheetTitle>
          <div className="mt-3 overflow-y-auto">
            <CommentThread
              postId={post.id}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
              onCountChange={(delta) => setCommentCount((c) => c + delta)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
