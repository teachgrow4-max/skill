"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { cn } from "@skilltego/utils";
import { getFeedAction, type FeedMode } from "../actions";
import { PostCard } from "./post-card";

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
  const [mode, setMode] = React.useState<FeedMode>(defaultMode ?? (isLoggedIn ? "following" : "latest"));
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

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

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

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
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
          {mode === "following"
            ? "Follow people to see their posts here, or check the Latest tab."
            : "No posts yet. Be the first to share something!"}
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      ))}

      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
