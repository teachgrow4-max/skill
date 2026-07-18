import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FollowRequestRow, FollowRequestStatus } from "@skilltego/types";

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

export async function createFollowRequest(
  client: Client,
  requesterId: string,
  targetId: string,
): Promise<void> {
  if (requesterId === targetId) throw new Error("Cannot follow yourself");
  const { error } = await client
    .from("follow_requests")
    .upsert(
      { requester_id: requesterId, target_id: targetId, status: "pending" },
      { onConflict: "requester_id,target_id" },
    );
  if (error) throw error;
}

export async function cancelFollowRequest(
  client: Client,
  requesterId: string,
  targetId: string,
): Promise<void> {
  const { error } = await client
    .from("follow_requests")
    .delete()
    .eq("requester_id", requesterId)
    .eq("target_id", targetId);
  if (error) throw error;
}

export async function respondToFollowRequest(
  client: Client,
  requesterId: string,
  targetId: string,
  status: "accepted" | "declined",
): Promise<void> {
  const { error } = await client
    .from("follow_requests")
    .update({ status })
    .eq("requester_id", requesterId)
    .eq("target_id", targetId);
  if (error) throw error;
}

export async function getFollowRequestStatus(
  client: Client,
  requesterId: string,
  targetId: string,
): Promise<FollowRequestStatus | null> {
  const { data, error } = await client
    .from("follow_requests")
    .select("status")
    .eq("requester_id", requesterId)
    .eq("target_id", targetId)
    .maybeSingle();
  if (error) throw error;
  return data?.status ?? null;
}

export async function getPendingFollowRequests(
  client: Client,
  targetId: string,
): Promise<FollowRequestRow[]> {
  const { data, error } = await client
    .from("follow_requests")
    .select("*")
    .eq("target_id", targetId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
