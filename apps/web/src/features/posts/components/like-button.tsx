"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@skilltego/utils";
import { toggleLikeAction } from "../actions";

interface LikeButtonProps {
  postId: string;
  initialIsLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}

export function LikeButton({ postId, initialIsLiked, initialCount, isLoggedIn }: LikeButtonProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = React.useState(initialIsLiked);
  const [count, setCount] = React.useState(initialCount);
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (pending) return;

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    setPending(true);

    const result = await toggleLikeAction(postId, isLiked);
    setPending(false);

    if (!result.success) {
      setIsLiked(isLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors",
        isLiked ? "text-destructive" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Heart className={cn("size-4", isLiked && "fill-current")} />
      {count > 0 && count}
    </button>
  );
}
