"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { PostComposerDialog } from "./post-composer-dialog";

export function CreatePostFab() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Create post"
        onClick={() => setOpen(true)}
        className="gradient-brand fixed bottom-20 left-1/2 z-40 flex size-14 -translate-x-1/2 items-center justify-center rounded-full text-white shadow-glow transition-transform hover:scale-105 md:bottom-8 md:left-auto md:right-8 md:size-16 md:translate-x-0"
      >
        <Plus className="size-7 md:size-8" />
      </button>
      <PostComposerDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
