"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Github,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pin,
  PinOff,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  Skeleton,
} from "@skilltego/ui";
import { cn, initials, formatRelativeTime } from "@skilltego/utils";
import type { Post } from "@skilltego/types";
import { ReportButton } from "@/features/reports/components/report-button";
import { deletePostAction, toggleArchivePostAction, togglePinPostAction } from "../actions";
import { LikeButton, type LikeButtonHandle } from "./like-button";
import { SaveButton } from "./save-button";
import { CommentThread } from "./comment-thread";

interface PostPreviewModalProps {
  post: Post | null;
  isLoggedIn: boolean;
  currentUserId: string | null;
  onOpenChange: (open: boolean) => void;
}

const CAPTION_TOKEN_PATTERN = /(@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+|https?:\/\/[^\s]+)/g;

function renderCaption(text: string) {
  return text.split(CAPTION_TOKEN_PATTERN).map((part, i) => {
    if (/^@[a-zA-Z0-9_]+$/.test(part)) {
      return (
        <Link key={i} href={`/profile/${part.slice(1)}`} className="font-medium text-primary hover:underline">
          {part}
        </Link>
      );
    }
    if (/^#[a-zA-Z0-9_]+$/.test(part)) {
      return (
        <span key={i} className="font-medium text-primary">
          {part}
        </span>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer noopener"
          className="break-all text-primary underline hover:no-underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function PostPreviewModal({ post, isLoggedIn, currentUserId, onOpenChange }: PostPreviewModalProps) {
  return (
    <Sheet open={post !== null} onOpenChange={onOpenChange}>
      {post && (
        // Keyed on post.id so switching between two posts remounts the panel
        // instead of patching state in place (avoids any stale-overlap glitches).
        <PostPreviewContent
          key={post.id}
          post={post}
          isLoggedIn={isLoggedIn}
          currentUserId={currentUserId}
          onOpenChange={onOpenChange}
        />
      )}
    </Sheet>
  );
}

function PostPreviewContent({
  post,
  isLoggedIn,
  currentUserId,
  onOpenChange,
}: {
  post: Post;
  isLoggedIn: boolean;
  currentUserId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [loadedSlides, setLoadedSlides] = React.useState<Record<number, boolean>>({});
  const [commentCount, setCommentCount] = React.useState(post.commentCount);
  const [isArchived, setIsArchived] = React.useState(post.isArchived);
  const [isPinned, setIsPinned] = React.useState(post.isPinned);
  const [showHeartBurst, setShowHeartBurst] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const likeButtonRef = React.useRef<LikeButtonHandle>(null);
  const touchStartX = React.useRef<number | null>(null);

  const isOwner = currentUserId === post.author.id;
  const media = post.media;

  const goTo = React.useCallback(
    (index: number) => setActiveSlide(((index % media.length) + media.length) % media.length),
    [media.length],
  );

  React.useEffect(() => {
    if (media.length <= 1) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goTo(activeSlide - 1);
      if (e.key === "ArrowRight") goTo(activeSlide + 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide, goTo, media.length]);

  function handleDoubleTapLike() {
    likeButtonRef.current?.like();
    setShowHeartBurst(true);
    window.setTimeout(() => setShowHeartBurst(false), 650);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) goTo(activeSlide + (delta < 0 ? 1 : -1));
    touchStartX.current = null;
  }

  async function handleShare() {
    const url = `${window.location.origin}/profile/${post.author.username}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: `${post.author.fullName} on Skilltego` });
      } catch {
        // user dismissed the native share sheet — nothing to do
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1500);
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!confirm("Delete this post? This can't be undone.")) return;
    const result = await deletePostAction(post.id);
    if (result.success) {
      onOpenChange(false);
      router.refresh();
    }
  }

  async function handleToggleArchive() {
    setMenuOpen(false);
    const result = await toggleArchivePostAction(post.id);
    if (result.success && result.data) {
      setIsArchived(result.data.isArchived);
      router.refresh();
    }
  }

  async function handleTogglePin() {
    setMenuOpen(false);
    setActionError(null);
    const result = await togglePinPostAction(post.id);
    if (result.success && result.data) {
      setIsPinned(result.data.isPinned);
      router.refresh();
    } else {
      setActionError(result.error ?? "Could not update post.");
    }
  }

  const activeMedia = media[activeSlide];

  return (
    <SheetContent
      hideClose
      className={cn(
        "flex flex-col gap-0 p-0 sm:max-w-[720px]",
        "h-[92vh] max-h-[92vh] sm:h-auto sm:max-h-[88vh]",
      )}
    >
      <SheetTitle className="sr-only">Post by {post.author.fullName}</SheetTitle>

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <Link
          href={`/profile/${post.author.username}`}
          className="flex min-w-0 items-center gap-3"
          onClick={() => onOpenChange(false)}
        >
          <Avatar className="size-11 shrink-0">
            <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.fullName} />
            <AvatarFallback>{initials(post.author.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-semibold leading-tight">{post.author.fullName}</span>
              {post.author.isVerified && <BadgeCheck className="size-3.5 shrink-0 text-primary" />}
              {isPinned && <Pin className="size-3 shrink-0 text-muted-foreground" aria-label="Pinned" />}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              @{post.author.username} · {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More options"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <MoreHorizontal className="size-[18px]" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 min-w-44 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={handleTogglePin}
                      className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs hover:bg-accent"
                    >
                      {isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                      {isPinned ? "Unpin from profile" : "Pin to profile"}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleArchive}
                      className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs hover:bg-accent"
                    >
                      {isArchived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                      {isArchived ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                    {actionError && <p className="mt-1 px-2.5 text-xs text-destructive">{actionError}</p>}
                  </>
                ) : (
                  <ReportButton targetType="post" targetId={post.id} isLoggedIn={isLoggedIn} />
                )}
              </div>
            )}
          </div>
          <SheetClose className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <X className="size-[18px]" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {isArchived && (
          <div className="px-4 pt-3 sm:px-5">
            <Badge variant="outline">Archived — only you can see this</Badge>
          </div>
        )}

        {media.length > 0 && (
          <div
            className="relative select-none bg-black"
            onDoubleClick={handleDoubleTapLike}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
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

            <div className="relative h-[60vh] max-h-[500px] w-full sm:h-[440px]">
              {activeMedia.type === "image" && (
                <>
                  {!loadedSlides[activeSlide] && <Skeleton className="absolute inset-0 rounded-none" />}
                  <Image
                    src={activeMedia.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 720px"
                    className="object-contain"
                    onLoad={() => setLoadedSlides((s) => ({ ...s, [activeSlide]: true }))}
                  />
                </>
              )}
              {activeMedia.type === "video" && (
                <video
                  src={activeMedia.url}
                  controls
                  className="h-full w-full object-contain"
                  onDoubleClick={(e) => e.stopPropagation()}
                />
              )}
              {activeMedia.type === "pdf" && (
                <a
                  href={activeMedia.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground"
                >
                  <FileText className="size-10" />
                  <span className="text-sm">View PDF</span>
                </a>
              )}
            </div>

            {media.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(activeSlide - 1)}
                  aria-label="Previous"
                  className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(activeSlide + 1)}
                  aria-label="Next"
                  className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="size-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {media.map((_, i) => (
                    <span
                      key={i}
                      className={cn("size-1.5 rounded-full transition-colors", i === activeSlide ? "bg-white" : "bg-white/40")}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid gap-3 px-4 py-4 sm:px-5">
          {post.type === "code" && post.codeSnippet && (
            <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs">
              {post.codeLanguage && <div className="mb-1 text-muted-foreground">{post.codeLanguage}</div>}
              <code>{post.codeSnippet}</code>
            </pre>
          )}

          {post.type === "github_link" && post.githubUrl && (
            <a
              href={post.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm hover:bg-accent"
            >
              <Github className="size-5 shrink-0" />
              <span className="truncate">{post.githubUrl}</span>
            </a>
          )}

          {post.type === "project_link" && post.projectUrl && (
            <a
              href={post.projectUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm hover:bg-accent"
            >
              <ExternalLink className="size-5 shrink-0" />
              <span className="truncate">{post.projectUrl}</span>
            </a>
          )}

          {post.caption && (
            <p className="text-[15px] leading-[1.7] whitespace-pre-line">{renderCaption(post.caption)}</p>
          )}

          {(post.skillCategory || post.tags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {post.skillCategory && <Badge variant="secondary">{post.skillCategory}</Badge>}
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="-mx-1 flex items-center gap-1 border-t border-border pt-3">
            <div className="rounded-full px-2 py-1.5 transition-colors hover:bg-accent">
              <LikeButton
                ref={likeButtonRef}
                postId={post.id}
                initialIsLiked={post.isLiked}
                initialCount={post.likeCount}
                isLoggedIn={isLoggedIn}
                hideCount={post.hideLikeCount && !isOwner}
                size="lg"
              />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}
              className="flex items-center gap-2 rounded-full px-2 py-1.5 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <MessageCircle className="size-6" />
              {commentCount > 0 && commentCount}
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share"
              className="flex items-center gap-2 rounded-full px-2 py-1.5 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {linkCopied ? <Check className="size-6 text-primary" /> : <Share2 className="size-6" />}
            </button>
            <div className="ml-auto rounded-full px-2 py-1.5 transition-colors hover:bg-accent">
              <SaveButton postId={post.id} initialIsSaved={post.isSaved} isLoggedIn={isLoggedIn} size="lg" />
            </div>
          </div>
          {linkCopied && <p className="-mt-2 text-xs text-muted-foreground">Link copied to clipboard</p>}

          <CommentThread
            postId={post.id}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
            onCountChange={(delta) => setCommentCount((c) => c + delta)}
            inputId={`comment-input-${post.id}`}
          />
        </div>
      </div>
    </SheetContent>
  );
}
