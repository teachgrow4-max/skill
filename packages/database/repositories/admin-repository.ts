import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PostRow, ProfileRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export interface PlatformStats {
  totalUsers: number;
  totalPosts: number;
  pendingReports: number;
  pendingVerifications: number;
  openOpportunities: number;
  usersByType: Record<string, number>;
}

export async function getPlatformStats(client: Client): Promise<PlatformStats> {
  const [usersResult, postsResult, reportsResult, verificationsResult, opportunitiesResult, profilesResult] =
    await Promise.all([
      client.from("profiles").select("*", { count: "exact", head: true }),
      client.from("posts").select("*", { count: "exact", head: true }),
      client.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      client
        .from("verification_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      client.from("opportunities").select("*", { count: "exact", head: true }).eq("status", "published"),
      client.from("profiles").select("account_type"),
    ]);

  if (usersResult.error) throw usersResult.error;
  if (postsResult.error) throw postsResult.error;
  if (reportsResult.error) throw reportsResult.error;
  if (verificationsResult.error) throw verificationsResult.error;
  if (opportunitiesResult.error) throw opportunitiesResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const usersByType: Record<string, number> = {};
  for (const row of profilesResult.data) {
    usersByType[row.account_type] = (usersByType[row.account_type] ?? 0) + 1;
  }

  return {
    totalUsers: usersResult.count ?? 0,
    totalPosts: postsResult.count ?? 0,
    pendingReports: reportsResult.count ?? 0,
    pendingVerifications: verificationsResult.count ?? 0,
    openOpportunities: opportunitiesResult.count ?? 0,
    usersByType,
  };
}

export async function searchUsers(client: Client, query: string, limit = 30): Promise<ProfileRow[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%`)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getRecentPosts(client: Client, limit = 30): Promise<PostRow[]> {
  const { data, error } = await client
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
