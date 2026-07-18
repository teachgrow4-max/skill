"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { Button } from "@skilltego/ui";
import { NewGroupModal } from "./new-group-modal";

export function NewGroupButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Users className="size-3.5" />
        New group
      </Button>
      {open && <NewGroupModal onClose={() => setOpen(false)} />}
    </>
  );
}
