"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge, Input } from "@skilltego/ui";
import { skillCategories } from "@skilltego/config";
import { initials } from "@skilltego/utils";
import type { Post } from "@skilltego/types";
import { PostCard } from "@/features/posts/components/post-card";
import { usePostDeleteSync } from "@/features/posts/hooks/use-post-delete-sync";
import { searchAction, type SearchResults } from "@/features/search/actions";

interface ExploreContentProps {
  trendingPosts: Post[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}

const CATEGORIES = skillCategories.flatMap((category) => category.subcategories);

export function ExploreContent({ trendingPosts, isLoggedIn, currentUserId }: ExploreContentProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [tab, setTab] = React.useState<"people" | "posts">("people");
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());

  usePostDeleteSync((id) => setDeletedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id))));

  const trimmed = query.trim();

  // Defense in depth: searchAction already excludes the viewer's own account,
  // but never show it here even if that filtering regresses upstream.
  const people = React.useMemo(
    () => results?.profiles.filter((profile) => profile.id !== currentUserId) ?? [],
    [results, currentUserId],
  );

  const visibleTrendingPosts = React.useMemo(
    () => trendingPosts.filter((post) => !deletedIds.has(post.id)),
    [trendingPosts, deletedIds],
  );
  const visibleResultPosts = React.useMemo(
    () => (results?.posts ?? []).filter((post) => !deletedIds.has(post.id)),
    [results, deletedIds],
  );

  React.useEffect(() => {
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const data = await searchAction(trimmed);
      setResults(data);
      setLoading(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [trimmed]);

  return (
    <div className="grid gap-6">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, skills, or posts…"
          className="pl-9"
        />
      </div>

      {trimmed.length < 2 ? (
        <>
          <div>
            <h1 className="mb-3 text-lg font-semibold">Browse categories</h1>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((sub) => (
                <button key={sub} type="button" onClick={() => setQuery(sub)}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    {sub}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Trending this week</h2>
            <div className="grid gap-4">
              {visibleTrendingPosts.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing trending yet.</p>
              )}
              {visibleTrendingPosts.map((post) => (
                <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="glass flex gap-1 rounded-full p-1">
            {(["people", "posts"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-full py-2 text-sm font-medium capitalize transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                {t} {results && `(${t === "people" ? people.length : visibleResultPosts.length})`}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && results && tab === "people" && (
            <div className="grid gap-2">
              {people.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm font-medium">No users found</p>
                  <p className="text-xs text-muted-foreground">Try searching for another username.</p>
                </div>
              )}
              {people.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/profile/${profile.username}`}
                  className="glass flex items-center gap-3 rounded-xl p-3 hover:bg-accent/40"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.fullName} />
                    <AvatarFallback>{initials(profile.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{profile.fullName}</p>
                    <p className="text-xs text-muted-foreground">@{profile.username}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto capitalize">
                    {profile.accountType}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {!loading && results && tab === "posts" && (
            <div className="grid gap-4">
              {visibleResultPosts.length === 0 && <p className="text-sm text-muted-foreground">No posts found.</p>}
              {visibleResultPosts.map((post) => (
                <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
