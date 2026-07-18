import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getConversationsByIds,
  getLastMessages,
  getParticipantsForConversations,
  getProfilesByIds,
  toAuthorSummary,
  toMessage,
} from "@skilltego/database";
import type { Conversation, Database, MessageRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function hydrateConversations(client: Client, conversationIds: string[], currentUserId: string): Promise<Conversation[]> {
  if (conversationIds.length === 0) return [];

  const [conversations, participantsMap, lastMessages] = await Promise.all([
    getConversationsByIds(client, conversationIds),
    getParticipantsForConversations(client, conversationIds),
    getLastMessages(client, conversationIds),
  ]);

  const allParticipantIds = [...new Set([...participantsMap.values()].flat().map((p) => p.userId))];
  const profiles = await getProfilesByIds(client, allParticipantIds);
  const profileMap = new Map(profiles.map((p) => [p.id, toAuthorSummary(p)]));

  const result = conversations.map((conversation): Conversation => {
    const participantRows = participantsMap.get(conversation.id) ?? [];
    const myRow = participantRows.find((p) => p.userId === currentUserId);
    const participants = participantRows
      .filter((p) => p.userId !== currentUserId)
      .map((p) => profileMap.get(p.userId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    const lastMessageRow = lastMessages.get(conversation.id) ?? null;
    const lastMessage = lastMessageRow
      ? toMessage(lastMessageRow, profileMap.get(lastMessageRow.sender_id) ?? unknownAuthor())
      : null;

    const unreadCount =
      lastMessageRow && myRow && lastMessageRow.sender_id !== currentUserId && lastMessageRow.created_at > myRow.lastReadAt
        ? 1
        : 0;

    return {
      id: conversation.id,
      isGroup: conversation.is_group,
      title: conversation.title,
      participants,
      lastMessage,
      unreadCount,
    };
  });

  return result.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? "";
    const bTime = b.lastMessage?.createdAt ?? "";
    return bTime.localeCompare(aTime);
  });
}

export async function hydrateMessages(client: Client, rows: MessageRow[]) {
  if (rows.length === 0) return [];
  const senderIds = [...new Set(rows.map((row) => row.sender_id))];
  const profiles = await getProfilesByIds(client, senderIds);
  const profileMap = new Map(profiles.map((p) => [p.id, toAuthorSummary(p)]));
  return rows.map((row) => toMessage(row, profileMap.get(row.sender_id) ?? unknownAuthor()));
}

function unknownAuthor() {
  return {
    id: "",
    username: "unknown",
    fullName: "Unknown user",
    avatarUrl: null,
    accountType: "student" as const,
    isVerified: false,
  };
}
