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
}: FollowButtonProps) {
  const router = useRouter();
  const [state, setState] = React.useState<FollowState>(initialState);
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=/profile/${targetUsername}`);
      return;
    }

    setPending(true);
    const result = await toggleFollowAction(targetProfileId, targetUsername);
    setPending(false);

    if (result.success && result.state) {
      setState(result.state);
      router.refresh();
    }
  }

  return (
    <Button variant={state === "none" ? "default" : "outline"} disabled={pending} onClick={handleClick}>
      {pending ? "…" : LABELS[state]}
    </Button>
  );
}
