"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { cn } from "@skilltego/utils";
import { toggleSaveAction } from "../actions";

interface SaveButtonProps {
  postId: string;
  initialIsSaved: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "lg";
}

export function SaveButton({ postId, initialIsSaved, isLoggedIn, size = "sm" }: SaveButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = React.useState(initialIsSaved);
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (pending) return;

    const next = !isSaved;
    setIsSaved(next);
    setPending(true);

    const result = await toggleSaveAction(postId, isSaved);
    setPending(false);

    if (!result.success) setIsSaved(isSaved);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSaved ? "Remove bookmark" : "Save"}
      className={cn(
        "text-muted-foreground transition-colors hover:text-foreground",
        isSaved && "text-primary hover:text-primary",
      )}
    >
      <motion.span
        className="inline-flex"
        whileTap={{ scale: 0.8 }}
        animate={isSaved ? { scale: [1, 1.25, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Bookmark className={cn(size === "lg" ? "size-6" : "size-4", isSaved && "fill-current")} />
      </motion.span>
    </button>
  );
}
