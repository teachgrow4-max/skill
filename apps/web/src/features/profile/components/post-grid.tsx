"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, MessageCircle, PlayCircle } from "lucide-react";
import type { Post } from "@skilltego/types";
import { PostDetailDialog } from "./post-detail-dialog";

interface PostGridProps {
  posts: Post[];
  isLoggedIn: boolean;
  currentUserId: string | null;
  emptyState: React.ReactNode;
}

export function PostGrid({ posts, isLoggedIn, currentUserId, emptyState }: PostGridProps) {
  const [selected, setSelected] = React.useState<Post | null>(null);

  if (posts.length === 0) return <>{emptyState}</>;

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => {
          const thumb = post.media[0]?.url ?? post.thumbnailUrl;
          const isVideo = post.media[0]?.type === "video";

          return (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelected(post)}
              className="group relative aspect-square overflow-hidden rounded-sm bg-muted"
            >
              {thumb ? (
                <Image
                  src={thumb}
                  alt=""
                  fill
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

      <PostDetailDialog
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
