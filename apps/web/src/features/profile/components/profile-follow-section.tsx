"use client";

import * as React from "react";
import type { Profile } from "@skilltego/types";
import type { FollowState } from "../social-actions";
import type { ProfileChangeStatus } from "../actions";
import { ProfileHeader } from "./profile-header";
import { ProfileStatsBar } from "./profile-stats-bar";

interface ProfileFollowSectionProps {
  profile: Profile;
  accountTypeLabel: string;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  viewerFollowState: FollowState;
  changeStatus?: ProfileChangeStatus;
  canViewContent: boolean;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

/**
 * Wraps ProfileHeader (owns the FollowButton) and ProfileStatsBar (renders
 * the follower count) so following/unfollowing this profile updates the
 * count on screen immediately instead of only after the next page load —
 * they're siblings server-rendered separately, so the follower count has to
 * live here to be shared between them.
 */
export function ProfileFollowSection({
  profile,
  accountTypeLabel,
  isOwnProfile,
  isLoggedIn,
  viewerFollowState,
  changeStatus,
  canViewContent,
  postCount,
  followerCount: initialFollowerCount,
  followingCount,
}: ProfileFollowSectionProps) {
  const [followerCount, setFollowerCount] = React.useState(initialFollowerCount);
  const lastStateRef = React.useRef(viewerFollowState);

  function handleFollowStateChange(next: FollowState) {
    const prev = lastStateRef.current;
    if (prev !== "following" && next === "following") setFollowerCount((c) => c + 1);
    else if (prev === "following" && next !== "following") setFollowerCount((c) => Math.max(0, c - 1));
    lastStateRef.current = next;
  }

  return (
    <>
      <ProfileHeader
        profile={profile}
        accountTypeLabel={accountTypeLabel}
        isOwnProfile={isOwnProfile}
        isLoggedIn={isLoggedIn}
        viewerFollowState={viewerFollowState}
        changeStatus={changeStatus}
        onFollowStateChange={handleFollowStateChange}
      />

      {canViewContent && (
        <ProfileStatsBar
          username={profile.username}
          postCount={postCount}
          followerCount={followerCount}
          followingCount={followingCount}
        />
      )}
    </>
  );
}
