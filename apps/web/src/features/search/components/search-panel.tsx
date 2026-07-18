"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge, Input } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import { PostCard } from "@/features/posts/components/post-card";
import { searchAction, type SearchResults } from "../actions";

interface SearchPanelProps {
  isLoggedIn: boolean;
  currentUserId: string | null;
}

export function SearchPanel({ isLoggedIn, currentUserId }: SearchPanelProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [tab, setTab] = React.useState<"people" | "posts">("people");

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      const data = await searchAction(query);
      setResults(data);
      setLoading(false);
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="grid gap-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, skills, or posts…"
          className="pl-9"
          autoFocus
        />
      </div>

      {query.trim().length >= 2 && (
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
              {t} {results && `(${t === "people" ? results.profiles.length : results.posts.length})`}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && results && tab === "people" && (
        <div className="grid gap-2">
          {results.profiles.length === 0 && <p className="text-sm text-muted-foreground">No people found.</p>}
          {results.profiles.map((profile) => (
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
          {results.posts.length === 0 && <p className="text-sm text-muted-foreground">No posts found.</p>}
          {results.posts.map((post) => (
            <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
