import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PostCommentRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function likePost(client: Client, postId: string, userId: string): Promise<void> {
  const { error } = await client.from("post_likes").insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function unlikePost(client: Client, postId: string, userId: string): Promise<void> {
  const { error } = await client.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  if (error) throw error;
}

export async function isPostLiked(client: Client, postId: string, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function getLikedPostIds(
  client: Client,
  postIds: string[],
  userId: string,
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const { data, error } = await client
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (error) throw error;
  return new Set(data.map((row) => row.post_id));
}

export async function savePost(client: Client, postId: string, userId: string): Promise<void> {
  const { error } = await client.from("post_saves").insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function unsavePost(client: Client, postId: string, userId: string): Promise<void> {
  const { error } = await client.from("post_saves").delete().eq("post_id", postId).eq("user_id", userId);
  if (error) throw error;
}

export async function getSavedPostIds(
  client: Client,
  postIds: string[],
  userId: string,
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const { data, error } = await client
    .from("post_saves")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (error) throw error;
  return new Set(data.map((row) => row.post_id));
}

export async function getSavedPosts(client: Client, userId: string): Promise<string[]> {
  const { data, error } = await client
    .from("post_saves")
    .select("post_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map((row) => row.post_id);
}

export async function addComment(
  client: Client,
  input: Database["public"]["Tables"]["post_comments"]["Insert"],
): Promise<PostCommentRow> {
  const { data, error } = await client.from("post_comments").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function getCommentById(client: Client, id: string): Promise<PostCommentRow | null> {
  const { data, error } = await client.from("post_comments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getComments(client: Client, postId: string): Promise<PostCommentRow[]> {
  const { data, error } = await client
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function deleteComment(client: Client, commentId: string): Promise<void> {
  const { error } = await client
    .from("post_comments")
    .update({ is_deleted: true, body: "[deleted]" })
    .eq("id", commentId);

  if (error) throw error;
}
