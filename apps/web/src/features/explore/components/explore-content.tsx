"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Search as SearchIcon, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge, Input } from "@skilltego/ui";
import { skillCategories } from "@skilltego/config";
import { cn, initials } from "@skilltego/utils";
import type { Post } from "@skilltego/types";
import { PostCard } from "@/features/posts/components/post-card";
import { usePostDeleteSync } from "@/features/posts/hooks/use-post-delete-sync";
import { searchAction, searchPostsByCategoryAction, type SearchResults } from "@/features/search/actions";
import { useDebouncedSearch } from "@/features/search/hooks/use-debounced-search";

interface ExploreContentProps {
  trendingPosts: Post[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}

const EMPTY_RESULTS: SearchResults = { profiles: [], posts: [] };

const CATEGORIES = skillCategories.flatMap((category) => category.subcategories);

export function ExploreContent({ trendingPosts, isLoggedIn, currentUserId }: ExploreContentProps) {
  const [query, setQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"people" | "posts">("people");
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());

  usePostDeleteSync((id) => setDeletedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id))));

  const trimmed = query.trim();

  const {
    data: results,
    loading,
    error,
  } = useDebouncedSearch(query, searchAction, { emptyValue: EMPTY_RESULTS });

  const {
    data: categoryPosts,
    loading: categoryLoading,
    error: categoryError,
  } = useDebouncedSearch(selectedCategory ?? "", searchPostsByCategoryAction, {
    delayMs: 0,
    minLength: 1,
    emptyValue: [] as Post[],
  });

  function selectCategory(category: string) {
    setQuery("");
    setSelectedCategory(category);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length > 0) setSelectedCategory(null);
  }

  // Defense in depth: searchAction already excludes the viewer's own account,
  // but never show it here even if that filtering regresses upstream.
  const people = React.useMemo(
    () => results.profiles.filter((profile) => profile.id !== currentUserId),
    [results, currentUserId],
  );

  const visibleTrendingPosts = React.useMemo(
    () => trendingPosts.filter((post) => !deletedIds.has(post.id)),
    [trendingPosts, deletedIds],
  );
  const visibleResultPosts = React.useMemo(
    () => results.posts.filter((post) => !deletedIds.has(post.id)),
    [results, deletedIds],
  );
  const visibleCategoryPosts = React.useMemo(
    () => categoryPosts.filter((post) => !deletedIds.has(post.id)),
    [categoryPosts, deletedIds],
  );

  return (
    <div className="grid gap-6">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search people, skills, or posts…"
          className="pl-9"
        />
      </div>

      {selectedCategory ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{selectedCategory}</h2>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              Clear
            </button>
          </div>

          {categoryLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {categoryError && <p className="text-sm text-destructive">{categoryError}</p>}

          {!categoryLoading && !categoryError && (
            <div className="grid gap-4">
              {visibleCategoryPosts.length === 0 && (
                <p className="text-sm text-muted-foreground">No posts in {selectedCategory} yet.</p>
              )}
              {visibleCategoryPosts.map((post) => (
                <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
              ))}
            </div>
          )}
        </>
      ) : trimmed.length < 2 ? (
        <>
          <div>
            <h1 className="mb-3 text-lg font-semibold">Browse categories</h1>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((sub) => (
                <button key={sub} type="button" onClick={() => selectCategory(sub)}>
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
                className={cn(
                  "flex-1 rounded-full py-2 text-sm font-medium capitalize transition-colors",
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50",
                )}
              >
                {t} ({t === "people" ? people.length : visibleResultPosts.length})
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && tab === "people" && (
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

          {!loading && !error && tab === "posts" && (
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
