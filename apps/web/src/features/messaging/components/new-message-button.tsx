"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@skilltego/ui";
import { NewMessageModal } from "./new-message-modal";

export function NewMessageButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageCircle className="size-3.5" />
        New message
      </Button>
      {open && <NewMessageModal onClose={() => setOpen(false)} />}
    </>
  );
}
