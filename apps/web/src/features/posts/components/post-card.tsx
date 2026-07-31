"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  BadgeCheck,
  ExternalLink,
  FileText,
  Github,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@skilltego/ui";
import { initials, formatRelativeTime } from "@skilltego/utils";
import type { Post } from "@skilltego/types";
import { ReportButton } from "@/features/reports/components/report-button";
import { deletePostAction, toggleArchivePostAction, togglePinPostAction } from "../actions";
import { LikeButton, type LikeButtonHandle } from "./like-button";
import { SaveButton } from "./save-button";
import { CommentThread } from "./comment-thread";

interface PostCardProps {
  post: Post;
  isLoggedIn: boolean;
  currentUserId: string | null;
}

export function PostCard({ post, isLoggedIn, currentUserId }: PostCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = React.useState(false);
  const [commentCount, setCommentCount] = React.useState(post.commentCount);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showHeartBurst, setShowHeartBurst] = React.useState(false);
  const [isArchived, setIsArchived] = React.useState(post.isArchived);
  const [isPinned, setIsPinned] = React.useState(post.isPinned);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const likeButtonRef = React.useRef<LikeButtonHandle>(null);
  const isOwner = currentUserId === post.author.id;

  function handleDoubleTapLike() {
    likeButtonRef.current?.like();
    setShowHeartBurst(true);
    window.setTimeout(() => setShowHeartBurst(false), 650);
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    const result = await deletePostAction(post.id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      router.refresh();
    }
  }

  async function handleToggleArchive() {
    setMenuOpen(false);
    const result = await toggleArchivePostAction(post.id);
    if (result.success && result.data) {
      setIsArchived(result.data.isArchived);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
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

  return (
    <article className="glass rounded-xl p-4">
      <div className="flex items-start justify-between">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-2.5">
          <Avatar className="size-10">
            <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.fullName} />
            <AvatarFallback>{initials(post.author.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">{post.author.fullName}</span>
              {post.author.isVerified && <BadgeCheck className="size-3.5 text-primary" />}
              {isPinned && <Pin className="size-3 text-muted-foreground" aria-label="Pinned" />}
            </div>
            <p className="text-xs text-muted-foreground">
              @{post.author.username} · {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-10 min-w-40 rounded-md border border-border bg-popover p-2 shadow-md">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    className="flex w-full items-center gap-1.5 whitespace-nowrap rounded px-2 py-1.5 text-xs hover:bg-accent"
                  >
                    {isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                    {isPinned ? "Unpin from profile" : "Pin to profile"}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleArchive}
                    className="flex w-full items-center gap-1.5 whitespace-nowrap rounded px-2 py-1.5 text-xs hover:bg-accent"
                  >
                    {isArchived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                    {isArchived ? "Unarchive" : "Archive"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-1.5 whitespace-nowrap rounded px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                  {actionError && <p className="mt-1 px-2 text-xs text-destructive">{actionError}</p>}
                </>
              ) : (
                <ReportButton targetType="post" targetId={post.id} isLoggedIn={isLoggedIn} />
              )}
            </div>
          )}
        </div>
      </div>

      {isArchived && (
        <Badge variant="outline" className="mt-2 w-fit">
          Archived — only you can see this
        </Badge>
      )}

      {post.caption && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{post.caption}</p>}

      {post.type === "code" && post.codeSnippet && (
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs">
          {post.codeLanguage && <div className="mb-1 text-muted-foreground">{post.codeLanguage}</div>}
          <code>{post.codeSnippet}</code>
        </pre>
      )}

      {post.type === "github_link" && post.githubUrl && (
        <a
          href={post.githubUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 flex items-center gap-2 rounded-lg border border-border p-3 text-sm hover:bg-accent"
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
          className="mt-3 flex items-center gap-2 rounded-lg border border-border p-3 text-sm hover:bg-accent"
        >
          <ExternalLink className="size-5 shrink-0" />
          <span className="truncate">{post.projectUrl}</span>
        </a>
      )}

      {post.media.length > 0 && (
        <div
          className={`relative mt-3 grid gap-1 ${post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
          onDoubleClick={handleDoubleTapLike}
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
          {post.media.map((item, i) => (
            <div
              key={item.publicId ?? item.url}
              className="relative aspect-video overflow-hidden rounded-lg bg-muted"
            >
              {item.type === "image" && (
                <Image src={item.url} alt="" fill quality={90} className="object-cover" unoptimized={i > 3} />
              )}
              {item.type === "video" && (
                <video src={item.url} controls className="h-full w-full object-cover" />
              )}
              {item.type === "pdf" && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground"
                >
                  <FileText className="size-8" />
                  <span className="text-xs">View PDF</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {(post.skillCategory || post.tags.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.skillCategory && <Badge variant="secondary">{post.skillCategory}</Badge>}
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-5">
        <LikeButton
          ref={likeButtonRef}
          postId={post.id}
          initialIsLiked={post.isLiked}
          initialCount={post.likeCount}
          isLoggedIn={isLoggedIn}
          hideCount={post.hideLikeCount && !isOwner}
        />
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="size-4" />
          {commentCount > 0 && commentCount}
        </button>
        <div className="ml-auto">
          <SaveButton postId={post.id} initialIsSaved={post.isSaved} isLoggedIn={isLoggedIn} />
        </div>
      </div>

      {showComments && (
        <div className="mt-3">
          <CommentThread
            postId={post.id}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
            onCountChange={(delta) => setCommentCount((c) => c + delta)}
          />
        </div>
      )}
    </article>
  );
}
