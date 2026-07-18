"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Button, Textarea } from "@skilltego/ui";
import { cn } from "@skilltego/utils";
import { submitMentorReviewAction } from "../actions";

export function ReviewForm({ sessionId, mentorId }: { sessionId: string; mentorId: string }) {
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    const result = await submitMentorReviewAction(sessionId, mentorId, rating, comment);
    setSubmitting(false);
    if (result.success) setSubmitted(true);
  }

  if (submitted) {
    return <p className="text-xs text-muted-foreground">Thanks for the feedback!</p>;
  }

  return (
    <div className="grid gap-2 rounded-lg border border-border p-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)}>
            <Star
              className={cn(
                "size-4",
                value <= rating ? "fill-current text-warning" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="How was the session?"
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button size="sm" className="w-fit" disabled={rating === 0 || submitting} onClick={handleSubmit}>
        Submit review
      </Button>
    </div>
  );
}
