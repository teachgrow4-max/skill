"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { PostComposerDialog } from "./post-composer-dialog";

export function CreatePostFab() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Only the Home feed — elsewhere it either has nothing to do (Explore,
  // Reels, …) or collides with a page's own bottom controls (a chat's Send
  // button sits in the same corner as this FAB).
  if (pathname !== "/feed") return null;

  return (
    <>
      <button
        type="button"
        aria-label="Create post"
        onClick={() => setOpen(true)}
        className="gradient-brand fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 flex size-14 animate-in items-center justify-center rounded-full text-white shadow-glow fade-in zoom-in duration-300 transition-transform hover:scale-105 active:scale-105 md:bottom-[calc(2rem+env(safe-area-inset-bottom))] md:right-[calc(2rem+env(safe-area-inset-right))] md:size-16"
      >
        <Plus className="size-7 md:size-8" />
      </button>
      <PostComposerDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
