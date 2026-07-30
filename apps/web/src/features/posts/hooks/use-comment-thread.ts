"use client";

import * as React from "react";
import type { Comment } from "@skilltego/types";
import { addCommentAction, deleteCommentAction, getPostCommentsAction } from "../actions";

/** Shared comment list/composer state for a post — used by both the inline
 * feed-card thread and the post preview modal's split sticky layout. */
export function useCommentThread(postId: string, onCountChange: (delta: number) => void) {
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

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
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

  return {
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
  };
}
