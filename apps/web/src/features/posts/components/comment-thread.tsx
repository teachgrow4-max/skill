"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage, Button, Input } from "@skilltego/ui";
import { cn, initials, formatRelativeTime } from "@skilltego/utils";
import type { Comment } from "@skilltego/types";
import { addCommentAction, deleteCommentAction, getPostCommentsAction } from "../actions";

interface CommentThreadProps {
  postId: string;
  isLoggedIn: boolean;
  currentUserId: string | null;
  onCountChange: (delta: number) => void;
}

function CommentRow({
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

export function CommentThread({ postId, isLoggedIn, currentUserId, onCountChange }: CommentThreadProps) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<Comment | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getPostCommentsAction(postId).then((data) => {
      if (!cancelled) {
        setComments(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const { roots, repliesByParent } = React.useMemo(() => {
    const roots: Comment[] = [];
    const repliesByParent = new Map<string, Comment[]>();

    for (const comment of comments) {
      if (comment.parentCommentId) {
        const list = repliesByParent.get(comment.parentCommentId) ?? [];
        list.push(comment);
        repliesByParent.set(comment.parentCommentId, list);
      } else {
        roots.push(comment);
      }
    }
    return { roots, repliesByParent };
  }, [comments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    const result = await addCommentAction(postId, { body, parentCommentId: replyingTo?.id ?? null });
    setSubmitting(false);

    if (result.success && result.data) {
      setComments((prev) => [...prev, result.data!.comment]);
      setBody("");
      setReplyingTo(null);
      onCountChange(1);
    }
  }

  async function handleDelete(commentId: string, authorId: string) {
    const result = await deleteCommentAction(commentId, authorId);
    if (result.success) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, isDeleted: true, body: "[deleted]" } : c)),
      );
    }
  }

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
          <div className="flex gap-2">
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={replyingTo ? `Reply to ${replyingTo.author.fullName}…` : "Write a comment…"}
              maxLength={1000}
            />
            <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
              Post
            </Button>
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
