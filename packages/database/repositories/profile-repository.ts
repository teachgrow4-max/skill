import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileField, ProfileRow } from "@skilltego/types";

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
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .in("id", [...new Set(ids)]);
  if (error) throw error;
  return data;
}

export async function isModerator(client: Client, userId: string): Promise<boolean> {
  const { data, error } = await client.from("profiles").select("account_type").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data?.account_type === "admin" || data?.account_type === "moderator";
}

export async function isAdmin(client: Client, userId: string): Promise<boolean> {
  const { data, error } = await client.from("profiles").select("account_type").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data?.account_type === "admin";
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
  const { data, error } = await client.from("profiles").update(patch).eq("id", id).select("*").single();

  if (error) throw error;
  return data;
}

// Postgres raises 42P01 if the table is genuinely missing; PostgREST raises
// its own PGRST205 when the table hasn't been picked up by its schema cache
// yet (e.g. immediately after the migration is applied, or before it's run
// at all). Fail open on either rather than blocking every profile save.
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205"]);

export async function getFieldChangeTimestamps(
  client: Client,
  profileId: string,
  field: ProfileField,
  sinceIso: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("profile_field_changes")
    .select("changed_at")
    .eq("profile_id", profileId)
    .eq("field", field)
    .gte("changed_at", sinceIso)
    .order("changed_at", { ascending: true });

  if (error) {
    if (MISSING_TABLE_CODES.has(error.code)) return [];
    throw error;
  }
  return data.map((row) => row.changed_at);
}

export async function recordFieldChange(
  client: Client,
  profileId: string,
  field: ProfileField,
): Promise<void> {
  const { error } = await client.from("profile_field_changes").insert({ profile_id: profileId, field });
  if (error && !MISSING_TABLE_CODES.has(error.code)) throw error;
}
