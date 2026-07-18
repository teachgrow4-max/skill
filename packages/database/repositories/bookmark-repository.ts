import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function bookmarkCandidate(client: Client, ownerId: string, candidateId: string): Promise<void> {
  const { error } = await client.from("candidate_bookmarks").insert({ owner_id: ownerId, candidate_id: candidateId });
  if (error) throw error;
}

export async function unbookmarkCandidate(client: Client, ownerId: string, candidateId: string): Promise<void> {
  const { error } = await client
    .from("candidate_bookmarks")
    .delete()
    .eq("owner_id", ownerId)
    .eq("candidate_id", candidateId);
  if (error) throw error;
}

export async function isCandidateBookmarked(client: Client, ownerId: string, candidateId: string): Promise<boolean> {
  const { data, error } = await client
    .from("candidate_bookmarks")
    .select("owner_id")
    .eq("owner_id", ownerId)
    .eq("candidate_id", candidateId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function getBookmarkedCandidates(client: Client, ownerId: string): Promise<ProfileRow[]> {
  const { data: bookmarks, error } = await client
    .from("candidate_bookmarks")
    .select("candidate_id")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = bookmarks.map((row) => row.candidate_id);
  if (ids.length === 0) return [];

  const { data: candidates, error: candidatesError } = await client.from("profiles").select("*").in("id", ids);
  if (candidatesError) throw candidatesError;

  const order = new Map(ids.map((id, index) => [id, index]));
  return [...candidates].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
