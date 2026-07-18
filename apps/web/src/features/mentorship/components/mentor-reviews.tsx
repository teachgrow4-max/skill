import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@skilltego/ui";
import { initials, formatRelativeTime } from "@skilltego/utils";
import { cn } from "@skilltego/utils";
import type { MentorReview } from "@skilltego/types";

export function MentorReviews({ reviews, average, count }: { reviews: MentorReview[]; average: number; count: number }) {
  return (
    <div className="grid gap-3">
      {count > 0 && (
        <div className="flex items-center gap-1 text-sm font-medium">
          <Star className="size-4 fill-current text-warning" />
          {average.toFixed(1)} <span className="text-muted-foreground">({count} review{count === 1 ? "" : "s"})</span>
        </div>
      )}
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-2">
          <Avatar className="size-7">
            <AvatarImage src={review.student.avatarUrl ?? undefined} alt={review.student.fullName} />
            <AvatarFallback className="text-xs">{initials(review.student.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{review.student.fullName}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star key={value} className={cn("size-3", value <= review.rating ? "fill-current text-warning" : "text-muted-foreground")} />
                ))}
              </div>
            </div>
            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            <p className="text-xs text-muted-foreground">{formatRelativeTime(review.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
