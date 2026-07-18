import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function followUser(client: Client, followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) throw new Error("Cannot follow yourself");
  const { error } = await client
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(client: Client, followerId: string, followingId: string): Promise<void> {
  const { error } = await client
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) throw error;
}

export async function isFollowing(client: Client, followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await client
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function getFollowerCount(client: Client, profileId: string): Promise<number> {
  const { count, error } = await client
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profileId);

  if (error) throw error;
  return count ?? 0;
}

export async function getFollowingCount(client: Client, profileId: string): Promise<number> {
  const { count, error } = await client
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profileId);

  if (error) throw error;
  return count ?? 0;
}

export async function getFollowingIds(client: Client, followerId: string): Promise<string[]> {
  const { data, error } = await client.from("follows").select("following_id").eq("follower_id", followerId);
  if (error) throw error;
  return data.map((row) => row.following_id);
}
