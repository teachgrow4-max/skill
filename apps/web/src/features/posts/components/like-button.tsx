"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@skilltego/utils";
import { toggleLikeAction } from "../actions";

interface LikeButtonProps {
  postId: string;
  initialIsLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}

export interface LikeButtonHandle {
  like: () => void;
}

export const LikeButton = React.forwardRef<LikeButtonHandle, LikeButtonProps>(function LikeButton(
  { postId, initialIsLiked, initialCount, isLoggedIn },
  ref,
) {
  const router = useRouter();
  const [isLiked, setIsLiked] = React.useState(initialIsLiked);
  const [count, setCount] = React.useState(initialCount);
  const pendingRef = React.useRef(false);

  async function toggle(nextLiked: boolean) {
    if (pendingRef.current) return;
    const wasLiked = isLiked;
    if (wasLiked === nextLiked) return;

    setIsLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    pendingRef.current = true;

    const result = await toggleLikeAction(postId, wasLiked);
    pendingRef.current = false;

    if (!result.success) {
      setIsLiked(wasLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
    }
  }

  React.useImperativeHandle(ref, () => ({
    like: () => {
      if (!isLoggedIn) return;
      toggle(true);
    },
  }));

  async function handleClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    toggle(!isLiked);
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
      <motion.span
        whileTap={{ scale: 0.8 }}
        animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart className={cn("size-4", isLiked && "fill-current")} />
      </motion.span>
      {count > 0 && count}
    </button>
  );
});
