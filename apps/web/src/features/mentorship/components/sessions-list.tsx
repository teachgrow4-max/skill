"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import type { MentorSession, SessionStatus } from "@skilltego/types";
import { updateSessionStatusAction } from "../actions";
import { ReviewForm } from "./review-form";

const STATUS_VARIANT: Record<SessionStatus, "outline" | "secondary" | "success" | "destructive"> = {
  requested: "outline",
  confirmed: "secondary",
  completed: "success",
  cancelled: "destructive",
};

export function SessionsList({
  sessions: initialSessions,
  role,
}: {
  sessions: MentorSession[];
  role: "mentor" | "student";
}) {
  const [sessions, setSessions] = React.useState(initialSessions);

  async function handleStatusChange(sessionId: string, status: SessionStatus) {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status } : s)));
    await updateSessionStatusAction(sessionId, status);
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No sessions yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {sessions.map((session) => {
        const other = role === "mentor" ? session.student : session.mentor;
        return (
          <div key={session.id} className="glass rounded-xl p-3">
            <div className="flex items-center gap-2.5">
              <Link href={`/profile/${other.username}`}>
                <Avatar className="size-9">
                  <AvatarImage src={other.avatarUrl ?? undefined} alt={other.fullName} />
                  <AvatarFallback>{initials(other.fullName)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <Link href={`/profile/${other.username}`} className="text-sm font-medium hover:underline">
                  {other.fullName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {new Date(session.scheduledAt).toLocaleString()} · {session.durationMinutes} min
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[session.status]} className="capitalize">
                {session.status}
              </Badge>
            </div>

            {role === "mentor" && session.status === "requested" && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => handleStatusChange(session.id, "confirmed")}>
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(session.id, "cancelled")}
                >
                  Decline
                </Button>
              </div>
            )}

            {role === "mentor" && session.status === "confirmed" && (
              <div className="mt-2">
                <Button size="sm" onClick={() => handleStatusChange(session.id, "completed")}>
                  Mark completed
                </Button>
              </div>
            )}

            {role === "student" && session.status === "completed" && (
              <div className="mt-2">
                <ReviewForm sessionId={session.id} mentorId={session.mentor.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
