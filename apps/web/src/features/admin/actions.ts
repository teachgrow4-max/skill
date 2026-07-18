"use server";

import { revalidatePath } from "next/cache";
import {
  deletePost,
  getPendingVerificationRequests,
  getPlatformStats,
  getRecentPosts,
  isAdmin,
  reviewVerificationRequest,
  searchUsers,
  updateProfile,
  type PlatformStats,
} from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import type { AccountType, PostRow, ProfileRow, VerificationRequestRow } from "@skilltego/types";

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, authorized: false };

  const authorized = await isAdmin(supabase, user.id);
  return { supabase, user, authorized };
}

export async function getAdminStatsAction(): Promise<PlatformStats | null> {
  const { supabase, authorized } = await requireAdmin();
  if (!authorized) return null;
  return getPlatformStats(supabase);
}

export async function getAdminUsersAction(query: string): Promise<ProfileRow[]> {
  const { supabase, authorized } = await requireAdmin();
  if (!authorized) return [];
  return searchUsers(supabase, query);
}

export async function updateUserAccountTypeAction(
  userId: string,
  accountType: AccountType,
): Promise<ActionResult> {
  const { supabase, authorized } = await requireAdmin();
  if (!authorized) return { success: false, error: "You don't have permission to do that." };

  try {
    await updateProfile(supabase, userId, { account_type: accountType });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update user." };
  }
}

export async function setUserVerifiedAction(userId: string, isVerified: boolean): Promise<ActionResult> {
  const { supabase, authorized } = await requireAdmin();
  if (!authorized) return { success: false, error: "You don't have permission to do that." };

  try {
    await updateProfile(supabase, userId, { is_verified: isVerified });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update user." };
  }
}

export async function getAdminPostsAction(): Promise<PostRow[]> {
  const { supabase, authorized } = await requireAdmin();
  if (!authorized) return [];
  return getRecentPosts(supabase);
}

export async function deletePostAsAdminAction(postId: string): Promise<ActionResult> {
  const { supabase, authorized } = await requireAdmin();
  if (!authorized) return { success: false, error: "You don't have permission to do that." };

  try {
    await deletePost(supabase, postId);
    revalidatePath("/admin/posts");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not delete post." };
  }
}

export async function getAdminVerificationRequestsAction(): Promise<VerificationRequestRow[]> {
  const { supabase, authorized } = await requireAdmin();
  if (!authorized) return [];
  return getPendingVerificationRequests(supabase);
}

export async function reviewVerificationRequestAction(
  requestId: string,
  profileId: string,
  status: "approved" | "rejected",
): Promise<ActionResult> {
  const { supabase, user, authorized } = await requireAdmin();
  if (!authorized || !user) return { success: false, error: "You don't have permission to do that." };

  try {
    await reviewVerificationRequest(supabase, requestId, status, user.id);
    if (status === "approved") {
      await updateProfile(supabase, profileId, { is_verified: true });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not review request." };
  }
}
