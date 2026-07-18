import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getConversationsByIds,
  getLastMessages,
  getParticipantsForConversations,
  getProfilesByIds,
  getReactionsForMessages,
  toAuthorSummary,
  toMessage,
} from "@skilltego/database";
import type { Conversation, Database, MessageReactionSummary, MessageRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function hydrateConversations(
  client: Client,
  conversationIds: string[],
  currentUserId: string,
): Promise<Conversation[]> {
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
      lastMessageRow &&
      myRow &&
      lastMessageRow.sender_id !== currentUserId &&
      lastMessageRow.created_at > myRow.lastReadAt
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

export async function hydrateMessages(
  client: Client,
  rows: MessageRow[],
  currentUserId: string | null = null,
) {
  if (rows.length === 0) return [];

  const senderIds = [...new Set(rows.map((row) => row.sender_id))];
  const messageIds = rows.map((row) => row.id);

  const [profiles, reactionRows] = await Promise.all([
    getProfilesByIds(client, senderIds),
    getReactionsForMessages(client, messageIds),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.id, toAuthorSummary(p)]));

  const reactionsByMessage = new Map<string, MessageReactionSummary[]>();
  for (const reaction of reactionRows) {
    const list = reactionsByMessage.get(reaction.message_id) ?? [];
    const existing = list.find((r) => r.emoji === reaction.emoji);
    if (existing) {
      existing.count += 1;
      if (reaction.user_id === currentUserId) existing.reactedByMe = true;
    } else {
      list.push({ emoji: reaction.emoji, count: 1, reactedByMe: reaction.user_id === currentUserId });
    }
    reactionsByMessage.set(reaction.message_id, list);
  }

  return rows.map((row) =>
    toMessage(row, profileMap.get(row.sender_id) ?? unknownAuthor(), reactionsByMessage.get(row.id) ?? []),
  );
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
