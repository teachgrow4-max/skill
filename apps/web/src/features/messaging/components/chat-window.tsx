"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Button, Input } from "@skilltego/ui";
import { cn, initials, formatRelativeTime } from "@skilltego/utils";
import type { AuthorSummary, Message } from "@skilltego/types";
import { createClient } from "@/lib/supabase/browser";
import { markConversationReadAction, sendMessageAction } from "../actions";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  participants: AuthorSummary[];
  initialMessages: Message[];
}

export function ChatWindow({ conversationId, currentUserId, participants, initialMessages }: ChatWindowProps) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const participantMap = React.useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants]);

  React.useEffect(() => {
    markConversationReadAction(conversationId);
  }, [conversationId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            body: string | null;
            attachment: Message["attachment"];
            is_edited: boolean;
            is_deleted: boolean;
            created_at: string;
            updated_at: string;
          };

          if (row.sender_id === currentUserId) return;

          const sender = participantMap.get(row.sender_id);
          if (!sender) return;

          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, {
            id: row.id,
            conversationId,
            sender,
            body: row.body,
            attachment: row.attachment,
            isEdited: row.is_edited,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }]));

          markConversationReadAction(conversationId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, participantMap]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;

    setError(null);
    setSending(true);
    const result = await sendMessageAction(conversationId, { body });
    setSending(false);

    if (!result.success) {
      setError(result.error ?? "Could not send message.");
      return;
    }

    if (result.data) {
      setMessages((prev) => [...prev, result.data!.message]);
    }
    setBody("");
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.map((message) => {
          const isMine = message.sender.id === currentUserId;
          return (
            <div key={message.id} className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}>
              <Avatar className="size-6">
                <AvatarImage src={message.sender.avatarUrl ?? undefined} alt={message.sender.fullName} />
                <AvatarFallback className="text-[10px]">{initials(message.sender.fullName)}</AvatarFallback>
              </Avatar>
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm", isMine ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {message.isDeleted ? <span className="italic text-muted-foreground">Message deleted</span> : message.body}
                <div className={cn("mt-0.5 text-[10px] opacity-70")}>{formatRelativeTime(message.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border pt-3">
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" maxLength={4000} />
        <Button type="submit" size="icon" disabled={sending || !body.trim()} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
