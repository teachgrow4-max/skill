"use client";

import * as React from "react";
import { SmilePlus } from "lucide-react";
import { cn } from "@skilltego/utils";
import type { MessageReactionSummary } from "@skilltego/types";
import { toggleMessageReactionAction } from "../actions";

const QUICK_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

export function MessageReactions({
  messageId,
  reactions,
  align,
}: {
  messageId: string;
  reactions: MessageReactionSummary[];
  align: "start" | "end";
}) {
  const [localReactions, setLocalReactions] = React.useState(reactions);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(() => setLocalReactions(reactions), [reactions]);

  async function handleToggle(emoji: string) {
    setPickerOpen(false);
    const existing = localReactions.find((r) => r.emoji === emoji);
    const currentlyReacted = existing?.reactedByMe ?? false;

    setLocalReactions((prev) => {
      const withoutEmoji = prev.filter((r) => r.emoji !== emoji);
      if (currentlyReacted) {
        return existing && existing.count > 1
          ? [...withoutEmoji, { ...existing, count: existing.count - 1, reactedByMe: false }]
          : withoutEmoji;
      }
      return existing
        ? [...withoutEmoji, { ...existing, count: existing.count + 1, reactedByMe: true }]
        : [...prev, { emoji, count: 1, reactedByMe: true }];
    });

    await toggleMessageReactionAction(messageId, emoji, currentlyReacted);
  }

  return (
    <div className={cn("relative flex items-center gap-1", align === "end" && "flex-row-reverse")}>
      {localReactions.length > 0 && (
        <div className="flex gap-1">
          {localReactions.map((reaction) => (
            <button
              key={reaction.emoji}
              type="button"
              onClick={() => handleToggle(reaction.emoji)}
              className={cn(
                "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px]",
                reaction.reactedByMe ? "border-primary bg-accent" : "border-border bg-background",
              )}
            >
              {reaction.emoji} {reaction.count}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        aria-label="React"
      >
        <SmilePlus className="size-3.5" />
      </button>

      {pickerOpen && (
        <div
          className={cn(
            "absolute bottom-6 z-10 flex gap-1 rounded-full border border-border bg-popover p-1 shadow-md",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleToggle(emoji)}
              className="p-1 text-sm hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
