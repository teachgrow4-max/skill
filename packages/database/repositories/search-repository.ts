import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PostRow, ProfileRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

const SEARCH_LIMIT = 20;

export async function searchProfiles(client: Client, query: string): Promise<ProfileRow[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .textSearch("search_vector", trimmed, { type: "websearch", config: "english" })
    .limit(SEARCH_LIMIT);

  if (error) throw error;
  return data;
}

export async function searchPosts(client: Client, query: string): Promise<PostRow[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("status", "published")
    .textSearch("search_vector", trimmed, { type: "websearch", config: "english" })
    .order("like_count", { ascending: false })
    .limit(SEARCH_LIMIT);

  if (error) throw error;
  return data;
}

export async function searchPostsByCategory(client: Client, category: string): Promise<PostRow[]> {
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("skill_category", category)
    .order("created_at", { ascending: false })
    .limit(SEARCH_LIMIT);

  if (error) throw error;
  return data;
}

export async function searchProfilesBySkill(client: Client, skillName: string): Promise<ProfileRow[]> {
  const { data, error } = await client
    .from("profile_skills")
    .select("profile_id")
    .ilike("skill_name", skillName);

  if (error) throw error;

  const profileIds = [...new Set(data.map((row) => row.profile_id))];
  if (profileIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await client
    .from("profiles")
    .select("*")
    .in("id", profileIds)
    .limit(SEARCH_LIMIT);

  if (profilesError) throw profilesError;
  return profiles;
}
