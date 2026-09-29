"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Bookmark, FastForward, Heart, MessageCircle, Pause, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@skilltego/ui";
import { cn, initials } from "@skilltego/utils";
import type { Post } from "@skilltego/types";
import { toggleLikeAction, toggleSaveAction } from "@/features/posts/actions";
import { CommentThread } from "@/features/posts/components/comment-thread";
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

/** How long a press must last before it counts as a hold rather than a tap. */
const HOLD_DELAY_MS = 250;
/** Finger drift (px) that cancels a pending hold — the user is scrolling, not holding. */
const HOLD_MOVE_TOLERANCE_PX = 10;
/** Fraction of the width on each side where holding speeds up instead of pausing. */
const SPEED_ZONE_FRACTION = 0.3;
const HOLD_SPEED = 2;

type HoldMode = "speed" | "pause" | null;

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
  const [isLiked, setIsLiked] = React.useState(post.isLiked);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);
  const [isSaved, setIsSaved] = React.useState(post.isSaved);
  const [showComments, setShowComments] = React.useState(false);
  const [commentCount, setCommentCount] = React.useState(post.commentCount);
  const setActiveVideo = useActiveVideoStore((s) => s.setActive);
  const activeVideoId = useActiveVideoStore((s) => s.activeId);
  const [holdMode, setHoldMode] = React.useState<HoldMode>(null);
  const holdTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const holdModeRef = React.useRef<HoldMode>(null);
  const suppressClickRef = React.useRef(false);
  const likePendingRef = React.useRef(false);

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

  // Instagram-style press-and-hold: holding the left/right edge plays at 2x,
  // holding the middle pauses. Either way, letting go resumes normal playback.
  // A quick tap still toggles play/pause.
  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function endHold() {
    clearHoldTimer();
    holdStartRef.current = null;
    const mode = holdModeRef.current;
    holdModeRef.current = null;
    setHoldMode(null);
    const video = videoRef.current;
    if (!video || !mode) return;
    video.playbackRate = 1;
    if (mode === "pause" && activeVideoId === post.id) video.play().catch(() => {});
  }

  function handlePointerDown(e: React.PointerEvent<HTMLVideoElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Zones are measured against the visible picture, not the element: with
    // object-contain a landscape reel is letterboxed, and the outer 30% of the
    // element would be almost entirely black bars. Holding on a bar counts as
    // an edge (relX < 0 or > 1).
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    let contentLeft = rect.left;
    let contentWidth = rect.width;
    if (el.videoWidth && el.videoHeight) {
      const scale = Math.min(rect.width / el.videoWidth, rect.height / el.videoHeight);
      contentWidth = el.videoWidth * scale;
      contentLeft = rect.left + (rect.width - contentWidth) / 2;
    }
    const relX = (e.clientX - contentLeft) / contentWidth;
    const mode: HoldMode =
      relX < SPEED_ZONE_FRACTION || relX > 1 - SPEED_ZONE_FRACTION ? "speed" : "pause";
    holdStartRef.current = { x: e.clientX, y: e.clientY };
    // Some mobile browsers never fire a click after a long press, so reset
    // here rather than trusting the previous gesture's click to clear it.
    suppressClickRef.current = false;
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      const video = videoRef.current;
      if (!video || video.paused) return;
      holdModeRef.current = mode;
      setHoldMode(mode);
      if (mode === "speed") video.playbackRate = HOLD_SPEED;
      else video.pause();
    }, HOLD_DELAY_MS);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLVideoElement>) {
    const start = holdStartRef.current;
    if (!start || holdModeRef.current) return;
    if (
      Math.abs(e.clientX - start.x) > HOLD_MOVE_TOLERANCE_PX ||
      Math.abs(e.clientY - start.y) > HOLD_MOVE_TOLERANCE_PX
    ) {
      clearHoldTimer();
      holdStartRef.current = null;
    }
  }

  function handleClick() {
    // The click that ends a hold shouldn't also toggle play/pause.
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function handlePointerUp() {
    if (holdModeRef.current) suppressClickRef.current = true;
    endHold();
  }

  // Scrolling to another reel mid-hold (or unmounting) must not leave this one
  // stuck at 2x.
  React.useEffect(() => {
    if (activeVideoId !== post.id) endHold();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideoId, post.id]);

  React.useEffect(() => clearHoldTimer, []);

  async function handleLike() {
    // Ignore taps while a toggle is in flight, or a fast double-tap sends the
    // same stale "was liked" state twice and the count drifts.
    if (likePendingRef.current) return;
    likePendingRef.current = true;
    const wasLiked = isLiked;
    const next = !wasLiked;
    setIsLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    const result = await toggleLikeAction(post.id, wasLiked);
    likePendingRef.current = false;
    if (!result.success) {
      setIsLiked(wasLiked);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
    }
  }

  async function handleSave() {
    const next = !isSaved;
    setIsSaved(next);
    const result = await toggleSaveAction(post.id, isSaved);
    if (!result.success) setIsSaved(isSaved);
  }

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
          className="h-full w-full select-none object-contain [-webkit-touch-callout:none]"
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={endHold}
          onPointerLeave={endHold}
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : post.thumbnailUrl ? (
        // Scrolled far enough away that the <video> element (and its decoder/
        // buffer) is unmounted entirely — just the poster stays, at effectively
        // no cost, so scrolling back doesn't show a blank frame while it reloads.
        <Image src={post.thumbnailUrl} alt="" fill className="object-contain" unoptimized />
      ) : (
        <div className="h-full w-full bg-black" />
      )}

      {holdMode === "speed" && (
        <div className="pointer-events-none absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">
          {HOLD_SPEED}x <FastForward className="size-4 fill-current" />
        </div>
      )}
      {holdMode === "pause" && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40 p-4 text-white">
          <Pause className="size-8 fill-current" />
        </div>
      )}

      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white"
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>

      <div className={cn("absolute bottom-4 left-4 right-16 text-white transition-opacity", holdMode && "pointer-events-none opacity-0")}>
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

      <div className={cn("absolute bottom-4 right-3 flex flex-col items-center gap-4 text-white transition-opacity", holdMode && "pointer-events-none opacity-0")}>
        <button type="button" onClick={handleLike} className="flex flex-col items-center gap-0.5">
          <Heart className={cn("size-7", isLiked && "fill-current text-destructive")} />
          <span className="text-xs">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex flex-col items-center gap-0.5"
        >
          <MessageCircle className="size-7" />
          <span className="text-xs">{commentCount}</span>
        </button>
        <button type="button" onClick={handleSave} className="flex flex-col items-center gap-0.5">
          <Bookmark className={cn("size-7", isSaved && "fill-current text-primary")} />
        </button>
      </div>

      {showComments && (
        <div className="absolute inset-x-0 bottom-0 z-10 max-h-[70%] overflow-y-auto rounded-t-2xl bg-background p-4">
          <CommentThread
            postId={post.id}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
            onCountChange={(delta) => setCommentCount((c) => c + delta)}
          />
        </div>
      )}
    </div>
  );
}
