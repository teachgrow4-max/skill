import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getConversationParticipantIds,
  getConversationsByIds,
  getProfilesByIds,
  toAuthorSummary,
} from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { getMessagesAction } from "@/features/messaging/actions";
import { ChatWindow } from "@/features/messaging/components/chat-window";

export const metadata: Metadata = { title: "Messages" };

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const participantIds = await getConversationParticipantIds(supabase, conversationId);
  if (!participantIds.includes(user.id)) notFound();

  const [conversation] = await getConversationsByIds(supabase, [conversationId]);
  if (!conversation) notFound();

  const profiles = await getProfilesByIds(supabase, participantIds);
  const participants = profiles.map(toAuthorSummary);

  const { messages } = await getMessagesAction(conversationId, null);

  return (
    <ChatWindow
      conversationId={conversationId}
      currentUserId={user.id}
      isGroup={conversation.is_group}
      title={conversation.title}
      avatarUrl={conversation.avatar_url}
      participants={participants}
      initialMessages={messages}
    />
  );
}
