"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Input } from "@skilltego/ui";
import { cn, formatRelativeTime, initials } from "@skilltego/utils";
import type { StoryGroup } from "@skilltego/types";
import { deleteStoryAction, getStoryViewersAction, respondToStoryAction, viewStoryAction } from "../actions";

const STORY_DURATION_MS = 5000;

interface StoryViewerProps {
  groups: StoryGroup[];
  startIndex: number;
  currentUserId: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function StoryViewer({ groups, startIndex, currentUserId, onClose, onDeleted }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = React.useState(startIndex);
  const [storyIndex, setStoryIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [showViewers, setShowViewers] = React.useState(false);
  const [viewers, setViewers] = React.useState<StoryGroup["stories"][number]["author"][]>([]);
  const [pollAnswer, setPollAnswer] = React.useState<number | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [replySent, setReplySent] = React.useState(false);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const isOwn = group?.author.id === currentUserId;

  React.useEffect(() => {
    setPollAnswer(null);
    setReplyText("");
    setReplySent(false);
    setShowViewers(false);
  }, [story?.id]);

  React.useEffect(() => {
    if (story && !isOwn) viewStoryAction(story.id);
  }, [story, isOwn]);

  const advance = React.useCallback(() => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
      setProgress(0);
      return;
    }
    if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
      setProgress(0);
      return;
    }
    onClose();
  }, [group, groupIndex, groups.length, onClose, storyIndex]);

  function goBack() {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setProgress(0);
      return;
    }
    if (groupIndex > 0) {
      setGroupIndex((i) => i - 1);
      setStoryIndex(0);
      setProgress(0);
    }
  }

  React.useEffect(() => {
    if (paused || showViewers) return;
    const tick = 50;
    const interval = window.setInterval(() => {
      setProgress((p) => {
        const next = p + (tick / STORY_DURATION_MS) * 100;
        if (next >= 100) {
          advance();
          return 0;
        }
        return next;
      });
    }, tick);
    return () => window.clearInterval(interval);
  }, [advance, paused, showViewers, storyIndex, groupIndex]);

  async function handleDelete() {
    if (!story || !confirm("Delete this story?")) return;
    await deleteStoryAction(story.id);
    onDeleted();
    advance();
  }

  async function handleShowViewers() {
    if (!story) return;
    setPaused(true);
    setShowViewers(true);
    const data = await getStoryViewersAction(story.id);
    setViewers(data);
  }

  async function handlePollVote(optionIndex: number) {
    if (!story || pollAnswer !== null) return;
    setPollAnswer(optionIndex);
    await respondToStoryAction(story.id, { optionIndex });
  }

  async function handleSendReply() {
    if (!story || !replyText.trim()) return;
    await respondToStoryAction(story.id, { text: replyText.trim() });
    setReplySent(true);
    setReplyText("");
  }

  if (!group || !story) return null;

  const sticker = story.stickerType;
  const stickerData = story.stickerData as Record<string, unknown>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-md flex-col">
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{ width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-3 top-7 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="size-8 border border-white/30">
              <AvatarImage src={group.author.avatarUrl ?? undefined} alt={group.author.fullName} />
              <AvatarFallback className="text-xs">{initials(group.author.fullName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-white">{group.author.username}</span>
            <span className="text-xs text-white/60">{formatRelativeTime(story.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3">
            {isOwn && (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Delete story"
                className="text-white/80"
              >
                <Trash2 className="size-4" />
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="text-white/80">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-black">
          {story.mediaType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.mediaUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <video src={story.mediaUrl} className="h-full w-full object-contain" autoPlay muted playsInline />
          )}

          <button
            type="button"
            aria-label="Previous"
            className="absolute inset-y-0 left-0 w-1/3"
            onClick={goBack}
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
          />
          <button
            type="button"
            aria-label="Next"
            className="absolute inset-y-0 right-0 w-1/3"
            onClick={advance}
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
          />

          {story.caption && (
            <p className="absolute bottom-24 left-4 right-4 text-center text-sm text-white">
              {story.caption}
            </p>
          )}

          {(sticker === "poll" || sticker === "quiz") && (
            <div className="absolute bottom-28 left-4 right-4 rounded-xl bg-black/50 p-3 text-white">
              <p className="mb-2 text-sm font-medium">{String(stickerData.question ?? "")}</p>
              <div className="flex gap-2">
                {(stickerData.options as string[] | undefined)?.map((option, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePollVote(i)}
                    className={cn(
                      "flex-1 rounded-full border border-white/40 py-1.5 text-xs",
                      pollAnswer === i && "gradient-brand border-transparent",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sticker === "question" && !isOwn && (
            <div className="absolute bottom-28 left-4 right-4 rounded-xl bg-black/50 p-3 text-white">
              <p className="mb-2 text-sm font-medium">{String(stickerData.prompt ?? "Ask me anything")}</p>
              {replySent ? (
                <p className="text-xs text-white/70">Sent!</p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply…"
                    className="border-white/30 bg-transparent text-white placeholder:text-white/50"
                  />
                  <button
                    type="button"
                    onClick={handleSendReply}
                    className="gradient-brand rounded-full px-3 text-xs"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          )}

          {isOwn && (
            <button
              type="button"
              onClick={handleShowViewers}
              className="absolute bottom-6 left-4 flex items-center gap-1.5 text-xs text-white/80"
            >
              <Eye className="size-4" />
              {story.viewCount} view{story.viewCount === 1 ? "" : "s"}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showViewers && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute inset-x-0 bottom-0 z-30 max-h-64 overflow-y-auto rounded-t-2xl bg-background p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Viewers</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowViewers(false);
                    setPaused(false);
                  }}
                >
                  <X className="size-4" />
                </button>
              </div>
              {viewers.length === 0 && <p className="text-xs text-muted-foreground">No views yet.</p>}
              <div className="grid gap-2">
                {viewers.map((viewer) => (
                  <div key={viewer.id} className="flex items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarImage src={viewer.avatarUrl ?? undefined} alt={viewer.fullName} />
                      <AvatarFallback className="text-xs">{initials(viewer.fullName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{viewer.fullName}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
