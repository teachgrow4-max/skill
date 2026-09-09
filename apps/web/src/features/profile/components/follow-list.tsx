"use client";

import * as React from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Search, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, EmptyState, Input } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import { getFollowersAction, getFollowingAction, removeFollowerAction } from "../social-actions";
import { FollowButton } from "./follow-button";

interface FollowListProps {
  mode: "followers" | "following";
  profileId: string;
  currentUserId: string | null;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  emptyTitle: string;
  emptyDescription: string;
}

export function FollowList({
  mode,
  profileId,
  currentUserId,
  isOwnProfile,
  isLoggedIn,
  emptyTitle,
  emptyDescription,
}: FollowListProps) {
  const [query, setQuery] = React.useState("");
  const [removedIds, setRemovedIds] = React.useState<Set<string>>(new Set());
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ["follow-list", mode, profileId],
    queryFn: ({ pageParam }) =>
      mode === "followers" ? getFollowersAction(profileId, pageParam) : getFollowingAction(profileId, pageParam),
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
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const items = (data?.pages.flatMap((page) => page.items) ?? []).filter(
    (item) => !removedIds.has(item.profile.id),
  );

  const trimmedQuery = query.trim().toLowerCase();
  const visibleItems = trimmedQuery
    ? items.filter(
        (item) =>
          item.profile.fullName.toLowerCase().includes(trimmedQuery) ||
          item.profile.username.toLowerCase().includes(trimmedQuery),
      )
    : items;

  async function handleRemove(followerId: string) {
    if (!confirm("Remove this follower?")) return;
    setRemovingId(followerId);
    const result = await removeFollowerAction(followerId);
    setRemovingId(null);
    if (result.success) {
      setRemovedIds((prev) => new Set(prev).add(followerId));
    }
  }

  return (
    <div className="grid gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === "followers" ? "Search followers…" : "Search following…"}
          className="pl-9"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && <p className="py-4 text-center text-sm text-destructive">Could not load this list. Try again.</p>}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}

      {!isLoading && !isError && items.length > 0 && visibleItems.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">No matches for &quot;{query.trim()}&quot;.</p>
      )}

      <div className="grid gap-1">
        {visibleItems.map((item) => (
          <div
            key={item.profile.id}
            className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-accent/40 sm:p-3"
          >
            <Link href={`/profile/${item.profile.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="size-11 shrink-0">
                <AvatarImage src={item.profile.avatarUrl ?? undefined} alt={item.profile.fullName} />
                <AvatarFallback>{initials(item.profile.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.profile.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">@{item.profile.username}</p>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              {item.profile.id !== currentUserId && (
                <FollowButton
                  targetProfileId={item.profile.id}
                  targetUsername={item.profile.username}
                  initialState={item.viewerFollowState}
                  isLoggedIn={isLoggedIn}
                />
              )}
              {mode === "followers" && isOwnProfile && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.profile.id)}
                  disabled={removingId === item.profile.id}
                  aria-label={`Remove ${item.profile.fullName} as a follower`}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  {removingId === item.profile.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserX className="size-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div ref={loadMoreRef} className="flex justify-center py-2">
        {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
