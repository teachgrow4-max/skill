"use server";

import { revalidatePath } from "next/cache";
import { followUser, isFollowing, unfollowUser } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";

export interface ToggleFollowResult {
  success: boolean;
  isFollowing?: boolean;
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
    } else {
      await followUser(supabase, user.id, targetProfileId);
    }

    revalidatePath(`/profile/${targetUsername}`);
    return { success: true, isFollowing: !currentlyFollowing };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}
