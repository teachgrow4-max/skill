import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  ProfileEducationRow,
  ProfileExperienceRow,
  ProfileSkillRow,
} from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function getProfileSkills(client: Client, profileId: string): Promise<ProfileSkillRow[]> {
  const { data, error } = await client
    .from("profile_skills")
    .select("*")
    .eq("profile_id", profileId)
    .order("is_primary", { ascending: false });

  if (error) throw error;
  return data;
}

/** Replaces the full skill set for a profile. */
export async function replaceProfileSkills(
  client: Client,
  profileId: string,
  skills: Database["public"]["Tables"]["profile_skills"]["Insert"][],
): Promise<ProfileSkillRow[]> {
  const { error: deleteError } = await client.from("profile_skills").delete().eq("profile_id", profileId);
  if (deleteError) throw deleteError;

  if (skills.length === 0) return [];

  const { data, error } = await client
    .from("profile_skills")
    .insert(skills.map((skill) => ({ ...skill, profile_id: profileId })))
    .select("*");

  if (error) throw error;
  return data;
}

export async function getProfileEducation(client: Client, profileId: string): Promise<ProfileEducationRow[]> {
  const { data, error } = await client
    .from("profile_education")
    .select("*")
    .eq("profile_id", profileId)
    .order("end_year", { ascending: false, nullsFirst: true });

  if (error) throw error;
  return data;
}

export async function getProfileExperience(client: Client, profileId: string): Promise<ProfileExperienceRow[]> {
  const { data, error } = await client
    .from("profile_experience")
    .select("*")
    .eq("profile_id", profileId)
    .order("is_current", { ascending: false });

  if (error) throw error;
  return data;
}
