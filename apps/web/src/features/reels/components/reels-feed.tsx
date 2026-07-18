"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getReelsAction } from "@/features/posts/actions";
import { ReelPlayer } from "./reel-player";

export function ReelsFeed({
  isLoggedIn,
  currentUserId,
}: {
  isLoggedIn: boolean;
  currentUserId: string | null;
}) {
  const [muted, setMuted] = React.useState(true);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["reels"],
    queryFn: ({ pageParam }) => getReelsAction(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  React.useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "800px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-9rem)] items-center justify-center md:h-[calc(100dvh-3rem)]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="glass flex h-[calc(100dvh-9rem)] items-center justify-center rounded-2xl p-8 text-center text-sm text-muted-foreground md:h-[calc(100dvh-3rem)]">
        No reels yet. Post a video to be the first!
      </div>
    );
  }

  return (
    <div className="scrollbar-none h-[calc(100dvh-9rem)] snap-y snap-mandatory overflow-y-auto md:h-[calc(100dvh-3rem)]">
      <div className="grid gap-3">
        {posts.map((post) => (
          <ReelPlayer
            key={post.id}
            post={post}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
          />
        ))}
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
}
