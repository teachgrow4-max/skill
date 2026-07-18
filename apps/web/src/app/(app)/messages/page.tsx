import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@skilltego/ui";
import { initials, formatRelativeTime } from "@skilltego/utils";
import { getConversationsAction } from "@/features/messaging/actions";
import { NewGroupButton } from "@/features/messaging/components/new-group-button";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const conversations = await getConversationsAction();

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Messages</h1>
        <NewGroupButton />
      </div>

      {conversations.length === 0 && (
        <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
          No conversations yet. Visit someone&apos;s profile and hit Message to start one.
        </div>
      )}

      <div className="grid gap-2">
        {conversations.map((conversation) => {
          const other = conversation.participants[0];
          const title = conversation.isGroup
            ? (conversation.title ?? "Group chat")
            : (other?.fullName ?? "Unknown");

          return (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="glass flex items-center gap-3 rounded-xl p-3 hover:bg-accent/40"
            >
              <Avatar className="size-11">
                <AvatarImage src={other?.avatarUrl ?? undefined} alt={title} />
                <AvatarFallback>{initials(title)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-semibold">{title}</p>
                  {conversation.lastMessage && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {conversation.lastMessage?.body ??
                    (conversation.lastMessage?.attachment ? "Sent an attachment" : "No messages yet")}
                </p>
              </div>
              {conversation.unreadCount > 0 && <Badge className="shrink-0">New</Badge>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
