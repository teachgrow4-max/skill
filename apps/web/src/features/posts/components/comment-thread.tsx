"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Input } from "@skilltego/ui";
import { cn, initials, formatRelativeTime } from "@skilltego/utils";
import type { Comment } from "@skilltego/types";
import { useCommentThread } from "../hooks/use-comment-thread";

interface CommentThreadProps {
  postId: string;
  isLoggedIn: boolean;
  currentUserId: string | null;
  onCountChange: (delta: number) => void;
  inputId?: string;
}

export function CommentRow({
  comment,
  currentUserId,
  nested,
  onDelete,
  onReply,
}: {
  comment: Comment;
  currentUserId: string | null;
  nested: boolean;
  onDelete: (id: string, authorId: string) => void;
  onReply: (comment: Comment) => void;
}) {
  return (
    <div className={cn("flex gap-2 text-sm", nested && "ml-9")}>
      <Link href={`/profile/${comment.author.username}`}>
        <Avatar className="size-7">
          <AvatarImage src={comment.author.avatarUrl ?? undefined} alt={comment.author.fullName} />
          <AvatarFallback className="text-xs">{initials(comment.author.fullName)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="rounded-lg bg-muted px-3 py-2">
          <Link href={`/profile/${comment.author.username}`} className="font-medium hover:underline">
            {comment.author.fullName}
          </Link>{" "}
          <span className={comment.isDeleted ? "italic text-muted-foreground" : ""}>{comment.body}</span>
        </div>
        <div className="mt-1 flex items-center gap-3 px-1 text-xs text-muted-foreground">
          <span>{formatRelativeTime(comment.createdAt)}</span>
          {!comment.isDeleted && (
            <button type="button" onClick={() => onReply(comment)} className="hover:text-foreground">
              Reply
            </button>
          )}
          {currentUserId === comment.author.id && !comment.isDeleted && (
            <button
              type="button"
              onClick={() => onDelete(comment.id, comment.author.id)}
              className="hover:text-destructive"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentThread({ postId, isLoggedIn, currentUserId, onCountChange, inputId }: CommentThreadProps) {
  const {
    loading,
    roots,
    repliesByParent,
    body,
    setBody,
    submitting,
    replyingTo,
    setReplyingTo,
    handleSubmit,
    handleDelete,
  } = useCommentThread(postId, onCountChange);

  return (
    <div className="grid gap-3 border-t border-border pt-3">
      {loading && <p className="text-xs text-muted-foreground">Loading comments…</p>}

      {!loading &&
        roots.map((comment) => (
          <div key={comment.id} className="grid gap-2">
            <CommentRow
              comment={comment}
              currentUserId={currentUserId}
              nested={false}
              onDelete={handleDelete}
              onReply={setReplyingTo}
            />
            {(repliesByParent.get(comment.id) ?? []).map((reply) => (
              <CommentRow
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                nested
                onDelete={handleDelete}
                onReply={setReplyingTo}
              />
            ))}
          </div>
        ))}

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="grid gap-1">
          {replyingTo && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Replying to {replyingTo.author.fullName}</span>
              <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-foreground">
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              id={inputId}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={replyingTo ? `Reply to ${replyingTo.author.fullName}…` : "Write a comment…"}
              maxLength={1000}
              className="h-11 rounded-full px-4"
            />
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              aria-label="Post comment"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>{" "}
          to comment.
        </p>
      )}
    </div>
  );
}
