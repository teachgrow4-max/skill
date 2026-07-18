"use server";

import { revalidatePath } from "next/cache";
import {
  cancelFollowRequest,
  createFollowRequest,
  followUser,
  getFollowRequestStatus,
  getPendingFollowRequests,
  getProfileById,
  getProfilesByIds,
  isFollowing,
  respondToFollowRequest,
  toAuthorSummary,
  unfollowUser,
} from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/web-push";
import type { AuthorSummary } from "@skilltego/types";

export type FollowState = "following" | "requested" | "none";

export interface ToggleFollowResult {
  success: boolean;
  state?: FollowState;
  error?: string;
}

export async function toggleFollowAction(
  targetProfileId: string,
  targetUsername: string,
): Promise<ToggleFollowResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to follow someone." };
  }

  if (user.id === targetProfileId) {
    return { success: false, error: "You can't follow yourself." };
  }

  try {
    const currentlyFollowing = await isFollowing(supabase, user.id, targetProfileId);

    if (currentlyFollowing) {
      await unfollowUser(supabase, user.id, targetProfileId);
      revalidatePath(`/profile/${targetUsername}`);
      return { success: true, state: "none" };
    }

    const requestStatus = await getFollowRequestStatus(supabase, user.id, targetProfileId);
    if (requestStatus === "pending") {
      await cancelFollowRequest(supabase, user.id, targetProfileId);
      revalidatePath(`/profile/${targetUsername}`);
      return { success: true, state: "none" };
    }

    const target = await getProfileById(supabase, targetProfileId);
    const follower = await getProfileById(supabase, user.id);

    if (target?.is_private) {
      await createFollowRequest(supabase, user.id, targetProfileId);
      revalidatePath(`/profile/${targetUsername}`);
      if (follower) {
        await sendPushToUser(supabase, targetProfileId, {
          title: follower.full_name,
          body: "Requested to follow you",
          url: `/follow-requests`,
        });
      }
      return { success: true, state: "requested" };
    }

    await followUser(supabase, user.id, targetProfileId);
    revalidatePath(`/profile/${targetUsername}`);

    if (follower) {
      await sendPushToUser(supabase, targetProfileId, {
        title: follower.full_name,
        body: "Started following you",
        url: `/profile/${follower.username}`,
      });
    }

    return { success: true, state: "following" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function getFollowStateAction(targetProfileId: string): Promise<FollowState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "none";

  const following = await isFollowing(supabase, user.id, targetProfileId);
  if (following) return "following";

  const requestStatus = await getFollowRequestStatus(supabase, user.id, targetProfileId);
  return requestStatus === "pending" ? "requested" : "none";
}

export interface FollowRequestItem {
  requester: AuthorSummary;
  createdAt: string;
}

export async function getMyPendingFollowRequestsAction(): Promise<FollowRequestItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const rows = await getPendingFollowRequests(supabase, user.id);
  const requesterIds = rows.map((row) => row.requester_id);
  const profiles = await getProfilesByIds(supabase, requesterIds);
  const profileMap = new Map(profiles.map((p) => [p.id, toAuthorSummary(p)]));

  return rows
    .filter((row) => profileMap.has(row.requester_id))
    .map((row) => ({ requester: profileMap.get(row.requester_id)!, createdAt: row.created_at }));
}

export async function respondToFollowRequestAction(
  requesterId: string,
  status: "accepted" | "declined",
): Promise<ToggleFollowResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    await respondToFollowRequest(supabase, requesterId, user.id, status);

    if (status === "accepted") {
      const accepter = await getProfileById(supabase, user.id);
      if (accepter) {
        await sendPushToUser(supabase, requesterId, {
          title: accepter.full_name,
          body: "Accepted your follow request",
          url: `/profile/${accepter.username}`,
        });
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}
