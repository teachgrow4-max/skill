"use server";

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
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { success: false, error: error.message };

  await supabase.auth.signOut();
  return { success: true };
}
