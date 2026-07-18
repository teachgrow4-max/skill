import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, StoryResponseRow, StoryRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function createStory(
  client: Client,
  input: Database["public"]["Tables"]["stories"]["Insert"],
): Promise<StoryRow> {
  const { data, error } = await client.from("stories").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteStory(client: Client, id: string): Promise<void> {
  const { error } = await client.from("stories").delete().eq("id", id);
  if (error) throw error;
}

export async function getActiveStoriesForAuthors(client: Client, authorIds: string[]): Promise<StoryRow[]> {
  if (authorIds.length === 0) return [];

  const { data, error } = await client
    .from("stories")
    .select("*")
    .in("author_id", authorIds)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getStoryById(client: Client, id: string): Promise<StoryRow | null> {
  const { data, error } = await client.from("stories").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function recordStoryView(client: Client, storyId: string, viewerId: string): Promise<void> {
  const { error } = await client
    .from("story_views")
    .upsert({ story_id: storyId, viewer_id: viewerId }, { onConflict: "story_id,viewer_id" });
  if (error) throw error;
}

export async function getViewedStoryIds(
  client: Client,
  storyIds: string[],
  viewerId: string,
): Promise<Set<string>> {
  if (storyIds.length === 0) return new Set();

  const { data, error } = await client
    .from("story_views")
    .select("story_id")
    .eq("viewer_id", viewerId)
    .in("story_id", storyIds);

  if (error) throw error;
  return new Set(data.map((row) => row.story_id));
}

export async function getStoryViewCounts(client: Client, storyIds: string[]): Promise<Map<string, number>> {
  if (storyIds.length === 0) return new Map();

  const { data, error } = await client.from("story_views").select("story_id").in("story_id", storyIds);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.story_id, (counts.get(row.story_id) ?? 0) + 1);
  }
  return counts;
}

export async function getStoryViewerIds(client: Client, storyId: string): Promise<string[]> {
  const { data, error } = await client
    .from("story_views")
    .select("viewer_id")
    .eq("story_id", storyId)
    .order("viewed_at", { ascending: false });

  if (error) throw error;
  return data.map((row) => row.viewer_id);
}

export async function submitStoryResponse(
  client: Client,
  input: Database["public"]["Tables"]["story_responses"]["Insert"],
): Promise<StoryResponseRow> {
  const { data, error } = await client
    .from("story_responses")
    .upsert(input, { onConflict: "story_id,viewer_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getStoryResponses(client: Client, storyId: string): Promise<StoryResponseRow[]> {
  const { data, error } = await client.from("story_responses").select("*").eq("story_id", storyId);
  if (error) throw error;
  return data;
}

export async function getMyStoryResponse(
  client: Client,
  storyId: string,
  viewerId: string,
): Promise<StoryResponseRow | null> {
  const { data, error } = await client
    .from("story_responses")
    .select("*")
    .eq("story_id", storyId)
    .eq("viewer_id", viewerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
