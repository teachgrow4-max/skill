"use server";

import { revalidatePath } from "next/cache";
import {
  claimCompleteProfileBonus,
  getFieldChangeTimestamps,
  getProfileById,
  isUsernameAvailable,
  recordFieldChange,
  replaceProfileSkills,
  updateProfile,
} from "@skilltego/database";
import { isValidUsername, RESERVED_USERNAMES } from "@skilltego/utils";
import type { ProfileField } from "@skilltego/types";
import { createClient } from "@/lib/supabase/server";
import { profileFormSchema, type ProfileFormValues } from "./schema";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof ProfileFormValues, string>>;
  username?: string;
  coinsAwarded?: number;
}

const CHANGE_WINDOW_DAYS = 30;
const FIELD_CHANGE_LIMITS: Record<ProfileField, number> = { full_name: 2, username: 1 };
const FIELD_LABELS: Record<ProfileField, string> = { full_name: "name", username: "username" };

export interface FieldChangeStatus {
  remaining: number;
  nextAvailableAt: string | null;
}

export interface ProfileChangeStatus {
  fullName: FieldChangeStatus;
  username: FieldChangeStatus;
}

function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(iso));
}

async function getFieldChangeStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  field: ProfileField,
): Promise<FieldChangeStatus> {
  const limit = FIELD_CHANGE_LIMITS[field];
  const since = new Date(Date.now() - CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const timestamps = await getFieldChangeTimestamps(supabase, profileId, field, since);

  return {
    remaining: Math.max(0, limit - timestamps.length),
    nextAvailableAt: timestamps.length >= limit ? addDays(timestamps[0], CHANGE_WINDOW_DAYS) : null,
  };
}

export async function getProfileChangeStatusAction(): Promise<ProfileChangeStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      fullName: { remaining: FIELD_CHANGE_LIMITS.full_name, nextAvailableAt: null },
      username: { remaining: FIELD_CHANGE_LIMITS.username, nextAvailableAt: null },
    };
  }

  const [fullName, username] = await Promise.all([
    getFieldChangeStatus(supabase, user.id, "full_name"),
    getFieldChangeStatus(supabase, user.id, "username"),
  ]);

  return { fullName, username };
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
    const message = RESERVED_USERNAMES.has(values.username)
      ? "This username is reserved. Please choose another."
      : "3-30 characters: lowercase letters, numbers, and underscores only.";
    return { success: false, fieldErrors: { username: message } };
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

  // Rate-limit name/username changes — but not during onboarding, where setting
  // them up for the first time shouldn't count against the limit.
  const isOnboarding = Boolean(options?.completeOnboarding);
  const changedFields: ProfileField[] = [];
  if (!isOnboarding) {
    if (values.fullName !== current.full_name) changedFields.push("full_name");
    if (values.username !== current.username) changedFields.push("username");

    for (const field of changedFields) {
      const status = await getFieldChangeStatus(supabase, user.id, field);
      if (status.remaining <= 0 && status.nextAvailableAt) {
        const formKey = field === "full_name" ? "fullName" : "username";
        return {
          success: false,
          fieldErrors: {
            [formKey]: `You've reached the limit for changing your ${FIELD_LABELS[field]} this month. Try again on ${formatDate(status.nextAvailableAt)}.`,
          },
        };
      }
    }
  }

  // Claimed before updateProfile flips onboarding_completed, since the RPC's
  // own idempotency check reads that same flag to decide whether to award.
  const coinsAwarded =
    isOnboarding && !current.onboarding_completed ? await claimCompleteProfileBonus(supabase) : 0;

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

    for (const field of changedFields) {
      await recordFieldChange(supabase, user.id, field);
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }

  return { success: true, username: values.username, coinsAwarded: coinsAwarded || undefined };
}

export async function updateAccountPrivacyAction(isPrivate: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to update this setting." };
  }

  await updateProfile(supabase, user.id, { is_private: isPrivate });
  revalidatePath("/settings/privacy");
  return { success: true };
}
