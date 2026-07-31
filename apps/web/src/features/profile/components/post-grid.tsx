"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, MessageCircle, PlayCircle } from "lucide-react";
import type { Post } from "@skilltego/types";
import { PostPreviewModal } from "@/features/posts/components/post-preview-modal";
import { usePostDeleteSync } from "@/features/posts/hooks/use-post-delete-sync";

interface PostGridProps {
  posts: Post[];
  isLoggedIn: boolean;
  currentUserId: string | null;
  emptyState: React.ReactNode;
}

export function PostGrid({ posts, isLoggedIn, currentUserId, emptyState }: PostGridProps) {
  const [selected, setSelected] = React.useState<Post | null>(null);
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());

  usePostDeleteSync((id) => {
    setDeletedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    setSelected((current) => (current?.id === id ? null : current));
  });

  const visiblePosts = posts.filter((post) => !deletedIds.has(post.id));

  if (visiblePosts.length === 0) return <>{emptyState}</>;

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {visiblePosts.map((post) => {
          const firstMedia = post.media[0];
          const isVideo = firstMedia?.type === "video";
          // Only an actual image (or a server-generated thumbnail) can be handed to
          // next/image — the raw video/PDF file URL isn't a renderable picture.
          const imageThumb = firstMedia?.type === "image" ? firstMedia.url : post.thumbnailUrl;

          return (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelected(post)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted transition-shadow hover:shadow-glow"
            >
              {isVideo ? (
                <video
                  src={firstMedia.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : imageThumb ? (
                <Image
                  src={imageThumb}
                  alt=""
                  fill
                  quality={90}
                  sizes="(max-width: 640px) 33vw, 220px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                  {post.caption?.slice(0, 80) ?? "Post"}
                </span>
              )}
              {isVideo && (
                <PlayCircle className="absolute right-2 top-2 size-5 text-white drop-shadow" aria-hidden />
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <Heart className="size-4 fill-white" aria-hidden /> {post.likeCount}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <MessageCircle className="size-4 fill-white" aria-hidden /> {post.commentCount}
                </span>
              </div>
              <span className="sr-only">
                Post with {post.likeCount} likes and {post.commentCount} comments
              </span>
            </button>
          );
        })}
      </div>

      <PostPreviewModal
        post={selected}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
