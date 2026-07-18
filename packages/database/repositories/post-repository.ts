import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PostRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export interface FeedPage {
  posts: PostRow[];
  nextCursor: string | null;
}

const PAGE_SIZE = 12;

export async function createPost(
  client: Client,
  input: Database["public"]["Tables"]["posts"]["Insert"],
): Promise<PostRow> {
  const { data, error } = await client.from("posts").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updatePost(
  client: Client,
  id: string,
  patch: Database["public"]["Tables"]["posts"]["Update"],
): Promise<PostRow> {
  const { data, error } = await client.from("posts").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deletePost(client: Client, id: string): Promise<void> {
  const { error } = await client.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function getPostById(client: Client, id: string): Promise<PostRow | null> {
  const { data, error } = await client.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPostsByIds(client: Client, ids: string[]): Promise<PostRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client.from("posts").select("*").in("id", ids);
  if (error) throw error;

  const order = new Map(ids.map((id, index) => [id, index]));
  return [...data].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getLatestPosts(client: Client, cursor: string | null): Promise<FeedPage> {
  let query = client
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;

  return {
    posts: data,
    nextCursor: data.length === PAGE_SIZE ? data[data.length - 1].created_at : null,
  };
}

export async function getFollowingPosts(
  client: Client,
  authorIds: string[],
  cursor: string | null,
): Promise<FeedPage> {
  if (authorIds.length === 0) return { posts: [], nextCursor: null };

  let query = client
    .from("posts")
    .select("*")
    .eq("status", "published")
    .in("author_id", authorIds)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;

  return {
    posts: data,
    nextCursor: data.length === PAGE_SIZE ? data[data.length - 1].created_at : null,
  };
}

export async function getTrendingPosts(client: Client, page: number): Promise<FeedPage> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("status", "published")
    .gte("created_at", since)
    .order("like_count", { ascending: false })
    .order("comment_count", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    posts: data,
    nextCursor: data.length === PAGE_SIZE ? String(page + 1) : null,
  };
}

export async function getPostsByAuthor(
  client: Client,
  authorId: string,
  cursor: string | null,
): Promise<FeedPage> {
  let query = client
    .from("posts")
    .select("*")
    .eq("author_id", authorId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;

  return {
    posts: data,
    nextCursor: data.length === PAGE_SIZE ? data[data.length - 1].created_at : null,
  };
}
