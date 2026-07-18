"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { cn } from "@skilltego/utils";
import { toggleSaveAction } from "../actions";

interface SaveButtonProps {
  postId: string;
  initialIsSaved: boolean;
  isLoggedIn: boolean;
}

export function SaveButton({ postId, initialIsSaved, isLoggedIn }: SaveButtonProps) {
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
      <Bookmark className={cn("size-4", isSaved && "fill-current")} />
    </button>
  );
}
