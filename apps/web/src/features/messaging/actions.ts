"use server";

import {
  createGroupConversation,
  getConversationParticipantIds,
  getMessages,
  getOrCreateDirectConversation,
  getUserConversationIds,
  markConversationRead,
  removeMessageReaction,
  sendMessage,
  setMessageReaction,
} from "@skilltego/database";
import { moderateText } from "@skilltego/moderation";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/web-push";
import { hydrateConversations, hydrateMessages } from "./service";
import { sendMessageSchema } from "./schema";
import type { Conversation, Message } from "@skilltego/types";

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function getConversationsAction(): Promise<Conversation[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const ids = await getUserConversationIds(supabase, user.id);
  return hydrateConversations(supabase, ids, user.id);
}

export async function startConversationAction(
  otherUserId: string,
): Promise<ActionResult<{ conversationId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };
  if (user.id === otherUserId) return { success: false, error: "You can't message yourself." };

  try {
    const conversationId = await getOrCreateDirectConversation(supabase, user.id, otherUserId);
    return { success: true, data: { conversationId } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not start conversation.",
    };
  }
}

export async function createGroupChatAction(
  participantIds: string[],
  title: string,
): Promise<ActionResult<{ conversationId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };
  if (participantIds.length < 2) return { success: false, error: "Pick at least 2 people for a group." };
  if (!title.trim()) return { success: false, error: "Give your group a name." };

  try {
    const conversationId = await createGroupConversation(supabase, user.id, participantIds, title.trim());
    return { success: true, data: { conversationId } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not create group." };
  }
}

export async function getMessagesAction(
  conversationId: string,
  cursor: string | null,
): Promise<{ messages: Message[]; nextCursor: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = await getMessages(supabase, conversationId, cursor);
  const messages = await hydrateMessages(supabase, page.messages, user?.id ?? null);
  return { messages, nextCursor: page.nextCursor };
}

export async function sendMessageAction(
  conversationId: string,
  input: {
    body?: string;
    attachment?: { url: string; type: "image" | "video" | "audio" | "pdf"; publicId?: string } | null;
  },
): Promise<ActionResult<{ message: Message }>> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid message." };
  }
  if (!parsed.data.body && !parsed.data.attachment) {
    return { success: false, error: "Write a message or attach a file." };
  }

  if (parsed.data.body) {
    const moderation = moderateText(parsed.data.body, { blockContactInfo: true });
    if (!moderation.allowed) {
      return { success: false, error: moderation.reasons[0] };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    const row = await sendMessage(supabase, {
      conversation_id: conversationId,
      sender_id: user.id,
      body: parsed.data.body || null,
      attachment: parsed.data.attachment ?? null,
    });

    const [message] = await hydrateMessages(supabase, [row], user.id);

    const participantIds = await getConversationParticipantIds(supabase, conversationId);
    const recipientIds = participantIds.filter((id) => id !== user.id);
    await Promise.all(
      recipientIds.map((recipientId) =>
        sendPushToUser(supabase, recipientId, {
          title: message.sender.fullName,
          body: message.body ?? "Sent an attachment",
          url: `/messages/${conversationId}`,
        }),
      ),
    );

    return { success: true, data: { message } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not send message." };
  }
}

export async function toggleMessageReactionAction(
  messageId: string,
  emoji: string,
  currentlyReacted: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    if (currentlyReacted) {
      await removeMessageReaction(supabase, messageId, user.id);
    } else {
      await setMessageReaction(supabase, messageId, user.id, emoji);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not react." };
  }
}

export async function markConversationReadAction(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await markConversationRead(supabase, conversationId, user.id);
}
