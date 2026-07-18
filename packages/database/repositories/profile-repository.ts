import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function getProfileByUsername(client: Client, username: string): Promise<ProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProfileById(client: Client, id: string): Promise<ProfileRow | null> {
  const { data, error } = await client.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfilesByIds(client: Client, ids: string[]): Promise<ProfileRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client.from("profiles").select("*").in("id", [...new Set(ids)]);
  if (error) throw error;
  return data;
}

export async function isModerator(client: Client, userId: string): Promise<boolean> {
  const { data, error } = await client.from("profiles").select("account_type").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data?.account_type === "admin" || data?.account_type === "moderator";
}

export async function isUsernameAvailable(client: Client, username: string): Promise<boolean> {
  const { data, error } = await client
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data === null;
}

export async function createProfile(
  client: Client,
  input: Database["public"]["Tables"]["profiles"]["Insert"],
): Promise<ProfileRow> {
  const { data, error } = await client
    .from("profiles")
    .insert({ ...input, username: input.username.toLowerCase() })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  client: Client,
  id: string,
  patch: Database["public"]["Tables"]["profiles"]["Update"],
): Promise<ProfileRow> {
  const { data, error } = await client
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
