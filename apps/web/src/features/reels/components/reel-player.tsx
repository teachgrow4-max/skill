"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, Bookmark, Heart, MessageCircle, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@skilltego/ui";
import { cn, initials } from "@skilltego/utils";
import type { Post } from "@skilltego/types";
import { toggleLikeAction, toggleSaveAction } from "@/features/posts/actions";
import { CommentThread } from "@/features/posts/components/comment-thread";

interface ReelPlayerProps {
  post: Post;
  isLoggedIn: boolean;
  currentUserId: string | null;
  muted: boolean;
  onToggleMute: () => void;
}

export function ReelPlayer({ post, isLoggedIn, currentUserId, muted, onToggleMute }: ReelPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isLiked, setIsLiked] = React.useState(post.isLiked);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);
  const [isSaved, setIsSaved] = React.useState(post.isSaved);
  const [showComments, setShowComments] = React.useState(false);
  const [commentCount, setCommentCount] = React.useState(post.commentCount);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(video);
    return () => observer.disconnect();
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

  async function handleSave() {
    const next = !isSaved;
    setIsSaved(next);
    const result = await toggleSaveAction(post.id, isSaved);
    if (!result.success) setIsSaved(isSaved);
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-[calc(100dvh-9rem)] w-full snap-start items-center justify-center overflow-hidden rounded-2xl bg-black md:h-[calc(100dvh-3rem)]"
    >
      <video
        ref={videoRef}
        src={post.media[0]?.url}
        loop
        muted={muted}
        playsInline
        className="h-full w-full object-contain"
        onClick={() => (videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause())}
      />

      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white"
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>

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

      <div className="absolute bottom-4 right-3 flex flex-col items-center gap-4 text-white">
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
