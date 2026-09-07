"use server";

import { cookies } from "next/headers";
import { removeAllUserStorage } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Deletes the signed-in user's auth record. profiles.id -> auth.users(id)
 * is ON DELETE CASCADE, and every other table cascades from profiles, so
 * this transitively removes all of the user's data.
 */
export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  const admin = createAdminClient();
  // Every upload this user ever made (avatar, cover, resume, post/reel/story
  // media) lives under their own `{userId}/...` folder across every media
  // bucket — cascading the DB rows away never touched any of it. Runs before
  // the account itself is gone so there's still a well-defined owner to look
  // up; uses the service-role client since RLS scoping wouldn't matter here
  // anyway (this removes the user's own files, but doing it before revoking
  // their account keeps this independent of their session state).
  await removeAllUserStorage(admin, user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { success: false, error: error.message };

  await supabase.auth.signOut();
  (await cookies()).delete("onboarding_done");
  return { success: true };
}

/**
 * Clears the "onboarding done" cookie set by saveProfileAction — httpOnly, so
 * only a server action can remove it. Must run on logout: otherwise a second
 * user signing in on the same browser would inherit the first user's cookie
 * and skip the mandatory onboarding check in middleware.
 */
export async function clearOnboardingCookieAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("onboarding_done");
}
