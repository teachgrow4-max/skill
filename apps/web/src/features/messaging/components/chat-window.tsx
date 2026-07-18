"use client";

import * as React from "react";
import { FileText, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Button, Input } from "@skilltego/ui";
import { cn, initials, formatRelativeTime } from "@skilltego/utils";
import type { AuthorSummary, Message } from "@skilltego/types";
import { createClient } from "@/lib/supabase/browser";
import { markConversationReadAction, sendMessageAction } from "../actions";
import { MessageReactions } from "./message-reactions";
import { VoiceRecorderButton } from "./voice-recorder-button";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  participants: AuthorSummary[];
  initialMessages: Message[];
}

function AttachmentView({ attachment }: { attachment: NonNullable<Message["attachment"]> }) {
  if (attachment.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={attachment.url} alt="" className="max-w-full rounded-lg" />;
  }
  if (attachment.type === "video") {
    return <video src={attachment.url} controls className="max-w-full rounded-lg" />;
  }
  if (attachment.type === "audio") {
    return <audio src={attachment.url} controls className="max-w-[220px]" />;
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer noopener"
      className="flex items-center gap-2 underline"
    >
      <FileText className="size-4 shrink-0" />
      File
    </a>
  );
}

export function ChatWindow({
  conversationId,
  currentUserId,
  participants,
  initialMessages,
}: ChatWindowProps) {
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
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
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

          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: row.id,
                    conversationId,
                    sender,
                    body: row.body,
                    attachment: row.attachment,
                    isEdited: row.is_edited,
                    isDeleted: row.is_deleted,
                    reactions: [],
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                  },
                ],
          );

          markConversationReadAction(conversationId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, participantMap]);

  async function sendPayload(payload: {
    body?: string;
    attachment?: { url: string; type: "image" | "video" | "audio" | "pdf"; publicId?: string } | null;
  }) {
    setError(null);
    setSending(true);
    const result = await sendMessageAction(conversationId, payload);
    setSending(false);

    if (!result.success) {
      setError(result.error ?? "Could not send message.");
      return;
    }
    if (result.data) {
      setMessages((prev) => [...prev, result.data!.message]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    await sendPayload({ body });
    setBody("");
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.map((message) => {
          const isMine = message.sender.id === currentUserId;
          return (
            <div key={message.id} className={cn("group flex items-end gap-2", isMine && "flex-row-reverse")}>
              <Avatar className="size-6">
                <AvatarImage src={message.sender.avatarUrl ?? undefined} alt={message.sender.fullName} />
                <AvatarFallback className="text-[10px]">{initials(message.sender.fullName)}</AvatarFallback>
              </Avatar>
              <div className={cn("flex max-w-[75%] flex-col gap-1", isMine && "items-end")}>
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm",
                    isMine ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {message.isDeleted ? (
                    <span className="italic text-muted-foreground">Message deleted</span>
                  ) : message.attachment ? (
                    <AttachmentView attachment={message.attachment} />
                  ) : (
                    message.body
                  )}
                  <div className="mt-0.5 text-[10px] opacity-70">{formatRelativeTime(message.createdAt)}</div>
                </div>
                {!message.isDeleted && (
                  <MessageReactions
                    messageId={message.id}
                    reactions={message.reactions}
                    align={isMine ? "end" : "start"}
                  />
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border pt-3">
        <VoiceRecorderButton onRecorded={(attachment) => sendPayload({ attachment })} />
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message…"
          maxLength={4000}
        />
        <Button type="submit" size="icon" disabled={sending || !body.trim()} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
