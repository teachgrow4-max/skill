"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@skilltego/ui";
import { toggleFollowAction } from "../social-actions";

interface FollowButtonProps {
  targetProfileId: string;
  targetUsername: string;
  initialIsFollowing: boolean;
  isLoggedIn: boolean;
}

export function FollowButton({
  targetProfileId,
  targetUsername,
  initialIsFollowing,
  isLoggedIn,
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = React.useState(initialIsFollowing);
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=/profile/${targetUsername}`);
      return;
    }

    setPending(true);
    const result = await toggleFollowAction(targetProfileId, targetUsername);
    setPending(false);

    if (result.success && result.isFollowing !== undefined) {
      setFollowing(result.isFollowing);
      router.refresh();
    }
  }

  return (
    <Button variant={following ? "outline" : "default"} disabled={pending} onClick={handleClick}>
      {pending ? "…" : following ? "Following" : "Follow"}
    </Button>
  );
}
