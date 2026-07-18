"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from "@skilltego/ui";
import { cn, initials } from "@skilltego/utils";
import type { ProfileRow } from "@skilltego/types";
import { MessageButton } from "@/features/messaging/components/message-button";
import { toggleCandidateBookmarkAction } from "../actions";

export function CandidateCard({
  candidate,
  initialBookmarked = false,
}: {
  candidate: ProfileRow;
  initialBookmarked?: boolean;
}) {
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [pending, setPending] = React.useState(false);

  async function handleBookmark() {
    setPending(true);
    const result = await toggleCandidateBookmarkAction(candidate.id, bookmarked);
    setPending(false);
    if (result.success && result.data) setBookmarked(result.data.isBookmarked);
  }

  return (
    <div className="glass flex items-center gap-3 rounded-xl p-3">
      <Link href={`/profile/${candidate.username}`}>
        <Avatar className="size-11">
          <AvatarImage src={candidate.avatar_url ?? undefined} alt={candidate.full_name} />
          <AvatarFallback>{initials(candidate.full_name)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/profile/${candidate.username}`} className="text-sm font-semibold hover:underline">
          {candidate.full_name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">@{candidate.username}</p>
      </div>
      <Badge variant="outline" className="capitalize">
        {candidate.account_type}
      </Badge>
      {candidate.resume_url && (
        <Button asChild size="icon" variant="ghost" aria-label="Resume">
          <a href={candidate.resume_url} target="_blank" rel="noreferrer noopener">
            <FileText className="size-4" />
          </a>
        </Button>
      )}
      <MessageButton targetUserId={candidate.id} isLoggedIn />
      <button
        type="button"
        onClick={handleBookmark}
        disabled={pending}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
        className={cn("text-muted-foreground hover:text-foreground", bookmarked && "text-primary")}
      >
        <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
      </button>
    </div>
  );
}
