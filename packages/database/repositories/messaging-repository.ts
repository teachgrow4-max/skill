import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversationRow, Database, MessageReactionRow, MessageRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export interface MessagePage {
  messages: MessageRow[];
  nextCursor: string | null;
}

const MESSAGE_PAGE_SIZE = 30;

/** Finds an existing 1:1 conversation between two users, or creates one. */
export async function getOrCreateDirectConversation(
  client: Client,
  userId: string,
  otherUserId: string,
): Promise<string> {
  const { data: mine, error: mineError } = await client
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  if (mineError) throw mineError;

  const myConversationIds = mine.map((row) => row.conversation_id);

  if (myConversationIds.length > 0) {
    const { data: shared, error: sharedError } = await client
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myConversationIds);
    if (sharedError) throw sharedError;

    const sharedIds = shared.map((row) => row.conversation_id);

    if (sharedIds.length > 0) {
      const { data: directConversation, error: directError } = await client
        .from("conversations")
        .select("id")
        .in("id", sharedIds)
        .eq("is_group", false)
        .limit(1)
        .maybeSingle();
      if (directError) throw directError;
      if (directConversation) return directConversation.id;
    }
  }

  const { data: conversation, error: convError } = await client
    .from("conversations")
    .insert({ created_by: userId, is_group: false })
    .select("id")
    .single();
  if (convError) throw convError;

  const { error: participantsError } = await client.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: userId },
    { conversation_id: conversation.id, user_id: otherUserId },
  ]);
  if (participantsError) throw participantsError;

  return conversation.id;
}

export async function getUserConversationIds(client: Client, userId: string): Promise<string[]> {
  const { data, error } = await client
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map((row) => row.conversation_id);
}

export async function getConversationsByIds(client: Client, ids: string[]): Promise<ConversationRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client.from("conversations").select("*").in("id", ids);
  if (error) throw error;
  return data;
}

export async function getConversationParticipantIds(
  client: Client,
  conversationId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId);
  if (error) throw error;
  return data.map((row) => row.user_id);
}

export async function getParticipantsForConversations(
  client: Client,
  conversationIds: string[],
): Promise<Map<string, { userId: string; lastReadAt: string }[]>> {
  if (conversationIds.length === 0) return new Map();

  const { data, error } = await client
    .from("conversation_participants")
    .select("conversation_id, user_id, last_read_at")
    .in("conversation_id", conversationIds);
  if (error) throw error;

  const map = new Map<string, { userId: string; lastReadAt: string }[]>();
  for (const row of data) {
    const list = map.get(row.conversation_id) ?? [];
    list.push({ userId: row.user_id, lastReadAt: row.last_read_at });
    map.set(row.conversation_id, list);
  }
  return map;
}

export async function getLastMessages(
  client: Client,
  conversationIds: string[],
): Promise<Map<string, MessageRow>> {
  if (conversationIds.length === 0) return new Map();

  const { data, error } = await client
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const map = new Map<string, MessageRow>();
  for (const message of data) {
    if (!map.has(message.conversation_id)) map.set(message.conversation_id, message);
  }
  return map;
}

export async function getLastReadAt(
  client: Client,
  conversationId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("conversation_participants")
    .select("last_read_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.last_read_at ?? null;
}

export async function getUnreadCount(
  client: Client,
  conversationId: string,
  userId: string,
): Promise<number> {
  const lastReadAt = await getLastReadAt(client, conversationId, userId);
  const { count, error } = await client
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .gt("created_at", lastReadAt ?? "1970-01-01");
  if (error) throw error;
  return count ?? 0;
}

export async function markConversationRead(
  client: Client,
  conversationId: string,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getMessages(
  client: Client,
  conversationId: string,
  cursor: string | null,
): Promise<MessagePage> {
  let query = client
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_PAGE_SIZE);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;

  return {
    messages: [...data].reverse(),
    nextCursor: data.length === MESSAGE_PAGE_SIZE ? data[data.length - 1].created_at : null,
  };
}

export async function sendMessage(
  client: Client,
  input: Database["public"]["Tables"]["messages"]["Insert"],
): Promise<MessageRow> {
  const { data, error } = await client.from("messages").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function createGroupConversation(
  client: Client,
  creatorId: string,
  participantIds: string[],
  title: string,
): Promise<string> {
  const { data: conversation, error: convError } = await client
    .from("conversations")
    .insert({ created_by: creatorId, is_group: true, title })
    .select("id")
    .single();
  if (convError) throw convError;

  const allParticipantIds = [...new Set([creatorId, ...participantIds])];
  const { error: participantsError } = await client
    .from("conversation_participants")
    .insert(allParticipantIds.map((userId) => ({ conversation_id: conversation.id, user_id: userId })));
  if (participantsError) throw participantsError;

  return conversation.id;
}

export async function setMessageReaction(
  client: Client,
  messageId: string,
  userId: string,
  emoji: string,
): Promise<void> {
  const { error } = await client
    .from("message_reactions")
    .upsert({ message_id: messageId, user_id: userId, emoji }, { onConflict: "message_id,user_id" });
  if (error) throw error;
}

export async function removeMessageReaction(
  client: Client,
  messageId: string,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getReactionsForMessages(
  client: Client,
  messageIds: string[],
): Promise<MessageReactionRow[]> {
  if (messageIds.length === 0) return [];
  const { data, error } = await client.from("message_reactions").select("*").in("message_id", messageIds);
  if (error) throw error;
  return data;
}
