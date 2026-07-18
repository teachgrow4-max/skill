"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@skilltego/ui";
import { initials, formatRelativeTime } from "@skilltego/utils";
import { respondToFollowRequestAction, type FollowRequestItem } from "../social-actions";

export function FollowRequestsList({ initialRequests }: { initialRequests: FollowRequestItem[] }) {
  const [requests, setRequests] = React.useState(initialRequests);

  async function handleRespond(requesterId: string, status: "accepted" | "declined") {
    setRequests((prev) => prev.filter((r) => r.requester.id !== requesterId));
    await respondToFollowRequestAction(requesterId, status);
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending follow requests.</p>;
  }

  return (
    <div className="grid gap-2">
      {requests.map((request) => (
        <div key={request.requester.id} className="glass flex items-center gap-3 rounded-xl p-3">
          <Link href={`/profile/${request.requester.username}`}>
            <Avatar className="size-10">
              <AvatarImage src={request.requester.avatarUrl ?? undefined} alt={request.requester.fullName} />
              <AvatarFallback>{initials(request.requester.fullName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${request.requester.username}`}
              className="text-sm font-medium hover:underline"
            >
              {request.requester.fullName}
            </Link>
            <p className="text-xs text-muted-foreground">
              @{request.requester.username} · {formatRelativeTime(request.createdAt)}
            </p>
          </div>
          <Button size="sm" onClick={() => handleRespond(request.requester.id, "accepted")}>
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleRespond(request.requester.id, "declined")}>
            Decline
          </Button>
        </div>
      ))}
    </div>
  );
}
