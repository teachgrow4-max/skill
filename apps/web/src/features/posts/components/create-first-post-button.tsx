"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@skilltego/ui";
import { PostComposerDialog } from "./post-composer-dialog";

export function CreateFirstPostButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="gradient-brand rounded-full text-white shadow-glow transition-transform hover:-translate-y-0.5 hover:shadow-glow-orange"
      >
        Create your first post
        <Plus className="size-4" />
      </Button>
      <PostComposerDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
