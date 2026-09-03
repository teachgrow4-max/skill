"use client";

import * as React from "react";
import { Pencil, X } from "lucide-react";
import { Button, Sheet, SheetContent, SheetTitle } from "@skilltego/ui";
import type { Profile } from "@skilltego/types";
import type { ProfileChangeStatus } from "../actions";
import { ProfileForm } from "./profile-form";

interface EditProfileSheetProps {
  profile: Profile;
  changeStatus: ProfileChangeStatus;
}

// Keeps /profile/edit as a real, bookmarkable route (ProfileForm needs no
// data-fetching of its own, so it's just as portable rendered here), but the
// primary "Edit profile" interaction now stays in context instead of
// navigating away.
export function EditProfileSheet({ profile, changeStatus }: EditProfileSheetProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="gradient-brand rounded-full text-white shadow-glow transition-transform hover:-translate-y-0.5 hover:shadow-glow-orange"
      >
        <Pencil className="size-4" />
        Edit profile
      </Button>
      <SheetContent
        hideClose
        style={{ background: "var(--color-card)" }}
        className="flex flex-col gap-0 p-0 sm:max-w-[640px]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <SheetTitle className="text-xl tracking-tight">Edit profile</SheetTitle>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ProfileForm profile={profile} mode="edit" changeStatus={changeStatus} onSaved={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
