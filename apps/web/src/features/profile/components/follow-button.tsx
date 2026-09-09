"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@skilltego/ui";
import { toggleFollowAction, type FollowState } from "../social-actions";

interface FollowButtonProps {
  targetProfileId: string;
  targetUsername: string;
  initialState: FollowState;
  isLoggedIn: boolean;
  targetIsPrivate?: boolean;
  /** Fired after every state transition (optimistic set, then the server-corrected one) so a parent can keep a derived follower count in sync. */
  onFollowStateChange?: (state: FollowState) => void;
}

const LABELS: Record<FollowState, string> = {
  following: "Following",
  requested: "Requested",
  none: "Follow",
};

export function FollowButton({
  targetProfileId,
  targetUsername,
  initialState,
  isLoggedIn,
  targetIsPrivate = false,
  onFollowStateChange,
}: FollowButtonProps) {
  const router = useRouter();
  const [state, setState] = React.useState<FollowState>(initialState);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=/profile/${targetUsername}`);
      return;
    }

    const previous = state;
    // Unfollowing always lands on "none"; following optimistically guesses
    // "requested" vs "following" from the target's privacy — the server
    // result (below) corrects this in the rare case it's wrong.
    const optimistic: FollowState = previous === "none" ? (targetIsPrivate ? "requested" : "following") : "none";
    setState(optimistic);
    onFollowStateChange?.(optimistic);

    const result = await toggleFollowAction(targetProfileId, targetUsername);

    if (result.success && result.state) {
      setState(result.state);
      onFollowStateChange?.(result.state);
    } else {
      setState(previous);
      onFollowStateChange?.(previous);
    }
  }

  return (
    <Button variant={state === "none" ? "default" : "outline"} onClick={handleClick}>
      {LABELS[state]}
    </Button>
  );
}
