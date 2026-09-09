"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@skilltego/utils";
import type { Post } from "@skilltego/types";
import { getFeedAction, getPostByIdAction, type FeedMode } from "../actions";
import { usePostDeleteSync } from "../hooks/use-post-delete-sync";
import { PostCard } from "./post-card";
import { PostCardSkeleton } from "./post-card-skeleton";
import { PostPreviewModal } from "./post-preview-modal";

const TABS: { mode: FeedMode; label: string }[] = [
  { mode: "following", label: "Following" },
  { mode: "latest", label: "Latest" },
  { mode: "trending", label: "Trending" },
];

interface FeedListProps {
  isLoggedIn: boolean;
  currentUserId: string | null;
  defaultMode?: FeedMode;
}

export function FeedList({ isLoggedIn, currentUserId, defaultMode }: FeedListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedPostId = searchParams.get("post");
  const [mode, setMode] = React.useState<FeedMode>(defaultMode ?? (isLoggedIn ? "following" : "latest"));
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());
  const [sharedPost, setSharedPost] = React.useState<Post | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  usePostDeleteSync((id) => setDeletedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id))));

  // Deep link from a share ("Share" on a post/reel copies /feed?post=<id>):
  // fetch and open just that post, regardless of whether it's in the loaded
  // feed window.
  React.useEffect(() => {
    if (!sharedPostId) {
      setSharedPost(null);
      return;
    }
    let cancelled = false;
    getPostByIdAction(sharedPostId).then((post) => {
      if (!cancelled) setSharedPost(post);
    });
    return () => {
      cancelled = true;
    };
  }, [sharedPostId]);

  function closeSharedPost() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("post");
    const query = params.toString();
    router.replace(query ? `/feed?${query}` : "/feed");
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["feed", mode],
    queryFn: ({ pageParam }) => getFeedAction(mode, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  React.useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const posts = (data?.pages.flatMap((page) => page.posts) ?? []).filter((post) => !deletedIds.has(post.id));

  return (
    <div className="grid gap-4">
      <div className="glass flex gap-1 rounded-full p-1">
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            onClick={() => setMode(tab.mode)}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-medium transition-colors",
              mode === tab.mode
                ? "gradient-brand text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
          {mode === "following"
            ? "Follow people to see their posts here, or check the Latest tab."
            : "No posts yet. Be the first to share something!"}
        </div>
      )}

      <AnimatePresence initial={false}>
        {posts.map((post) => (
          <motion.div
            key={post.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <PostCard post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
          </motion.div>
        ))}
      </AnimatePresence>

      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
      </div>

      <PostPreviewModal
        post={sharedPost}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        onOpenChange={(open) => {
          if (!open) closeSharedPost();
        }}
      />
    </div>
  );
}
