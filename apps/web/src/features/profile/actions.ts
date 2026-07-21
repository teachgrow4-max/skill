"use server";

import {
  getProfileById,
  isUsernameAvailable,
  replaceProfileSkills,
  updateProfile,
} from "@skilltego/database";
import { isValidUsername } from "@skilltego/utils";
import { createClient } from "@/lib/supabase/server";
import { profileFormSchema, type ProfileFormValues } from "./schema";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof ProfileFormValues, string>>;
  username?: string;
}

export async function checkUsernameAvailableAction(username: string): Promise<boolean> {
  const normalized = username.trim().toLowerCase();
  if (!isValidUsername(normalized)) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const current = await getProfileById(supabase, user.id);
    if (current?.username === normalized) return true;
  }

  return isUsernameAvailable(supabase, normalized);
}

export async function saveProfileAction(
  input: ProfileFormValues,
  options?: { completeOnboarding?: boolean },
): Promise<ActionResult> {
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: ActionResult["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ProfileFormValues | undefined;
      if (key) fieldErrors[key] = issue.message;
    }
    return { success: false, error: "Please fix the errors in the form.", fieldErrors };
  }

  const values = parsed.data;

  if (!isValidUsername(values.username)) {
    return {
      success: false,
      fieldErrors: { username: "3-30 characters: lowercase letters, numbers, and underscores only." },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to update your profile." };
  }

  const current = await getProfileById(supabase, user.id);
  if (!current) {
    return { success: false, error: "Profile not found." };
  }

  if (values.username !== current.username) {
    const available = await isUsernameAvailable(supabase, values.username);
    if (!available) {
      return { success: false, fieldErrors: { username: "This username is already taken." } };
    }
  }

  try {
    await updateProfile(supabase, user.id, {
      username: values.username,
      full_name: values.fullName,
      account_type: values.accountType,
      bio: values.bio || null,
      country: values.country || null,
      state: values.state || null,
      city: values.city || null,
      website: values.website || null,
      resume_url: values.resumeUrl || null,
      avatar_url: values.avatarUrl || null,
      cover_url: values.coverUrl || null,
      is_private: values.isPrivate,
      onboarding_completed: options?.completeOnboarding ? true : current.onboarding_completed,
    });

    await replaceProfileSkills(
      supabase,
      user.id,
      values.skills.map((skill) => ({
        skill_name: skill.skillName,
        category: skill.category,
        proficiency: skill.proficiency,
        is_primary: skill.isPrimary,
        profile_id: user.id,
      })),
    );
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }

  return { success: true, username: values.username };
}
