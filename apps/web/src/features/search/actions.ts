"use server";

import { searchPosts, searchProfiles, searchProfilesBySkill, toAuthorSummary } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { hydratePosts } from "@/features/posts/service";
import type { AuthorSummary, Post } from "@skilltego/types";

export interface SearchResults {
  profiles: AuthorSummary[];
  posts: Post[];
}

export async function searchAction(query: string): Promise<SearchResults> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { profiles: [], posts: [] };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileRows, skillProfileRows, postRows] = await Promise.all([
    searchProfiles(supabase, trimmed, user?.id),
    searchProfilesBySkill(supabase, `%${trimmed}%`, user?.id),
    searchPosts(supabase, trimmed),
  ]);

  const profileMap = new Map(
    [...profileRows, ...skillProfileRows].map((row) => [row.id, toAuthorSummary(row)]),
  );

  // Defense in depth: the repository queries already exclude the viewer, but
  // never surface your own account in search results even if that changes.
  if (user) profileMap.delete(user.id);

  const posts = await hydratePosts(supabase, postRows, user?.id ?? null);

  return { profiles: [...profileMap.values()], posts };
}
