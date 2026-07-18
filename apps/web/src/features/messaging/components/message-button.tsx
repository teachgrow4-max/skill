"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@skilltego/ui";
import { startConversationAction } from "../actions";

export function MessageButton({ targetUserId, isLoggedIn }: { targetUserId: string; isLoggedIn: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setPending(true);
    const result = await startConversationAction(targetUserId);
    setPending(false);

    if (result.success && result.data) {
      router.push(`/messages/${result.data.conversationId}`);
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={pending}>
      <MessageCircle className="size-4" />
      Message
    </Button>
  );
}
