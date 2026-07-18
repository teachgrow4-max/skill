"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@skilltego/ui";
import { cn, initials } from "@skilltego/utils";
import type { StoryGroup } from "@skilltego/types";
import { getStoriesFeedAction } from "../actions";
import { StoryCreator } from "./story-creator";
import { StoryViewer } from "./story-viewer";

export function StoriesBar({ currentUserId }: { currentUserId: string | null }) {
  const [groups, setGroups] = React.useState<StoryGroup[] | null>(null);
  const [creatorOpen, setCreatorOpen] = React.useState(false);
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);

  const refresh = React.useCallback(async () => {
    const data = await getStoriesFeedAction();
    setGroups(data);
  }, []);

  React.useEffect(() => {
    if (currentUserId) refresh();
  }, [currentUserId, refresh]);

  if (!currentUserId) return null;

  const myGroup = groups?.find((g) => g.author.id === currentUserId);
  const otherGroups = groups?.filter((g) => g.author.id !== currentUserId) ?? [];
  const orderedGroups = myGroup ? [myGroup, ...otherGroups] : otherGroups;

  function handleMyStoryClick() {
    if (myGroup) {
      setViewerIndex(0);
    } else {
      setCreatorOpen(true);
    }
  }

  return (
    <div className="glass flex gap-4 overflow-x-auto rounded-xl p-4">
      <button
        type="button"
        onClick={handleMyStoryClick}
        className="flex shrink-0 flex-col items-center gap-1"
      >
        <div className="relative">
          {myGroup ? (
            <div className={cn("rounded-full p-0.5", myGroup.allViewed ? "bg-border" : "gradient-brand")}>
              <Avatar className="size-14 border-2 border-background">
                <AvatarImage src={myGroup.author.avatarUrl ?? undefined} alt={myGroup.author.fullName} />
                <AvatarFallback className="text-xs">{initials(myGroup.author.fullName)}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground">
              <Plus className="size-5" />
            </div>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCreatorOpen(true);
            }}
            aria-label="Add to story"
            className="gradient-brand absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background text-white"
          >
            <Plus className="size-3" />
          </button>
        </div>
        <span className="text-[11px] text-muted-foreground">Your story</span>
      </button>

      {otherGroups.map((group) => (
        <button
          key={group.author.id}
          type="button"
          onClick={() => setViewerIndex(orderedGroups.findIndex((g) => g.author.id === group.author.id))}
          className="flex shrink-0 flex-col items-center gap-1"
        >
          <div className={cn("rounded-full p-0.5", group.allViewed ? "bg-border" : "gradient-brand")}>
            <Avatar className="size-14 border-2 border-background">
              <AvatarImage src={group.author.avatarUrl ?? undefined} alt={group.author.fullName} />
              <AvatarFallback className="text-xs">{initials(group.author.fullName)}</AvatarFallback>
            </Avatar>
          </div>
          <span className="max-w-14 truncate text-[11px] text-muted-foreground">{group.author.username}</span>
        </button>
      ))}

      {creatorOpen && (
        <StoryCreator
          onClose={() => setCreatorOpen(false)}
          onCreated={() => {
            setCreatorOpen(false);
            refresh();
          }}
        />
      )}

      {viewerIndex !== null && (
        <StoryViewer
          groups={orderedGroups}
          startIndex={viewerIndex}
          currentUserId={currentUserId}
          onClose={() => setViewerIndex(null)}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}
