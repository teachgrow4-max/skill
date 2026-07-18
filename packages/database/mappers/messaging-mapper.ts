import type {
  AuthorSummary,
  Message,
  MessageReactionSummary,
  MessageRow,
  Notification,
  NotificationRow,
} from "@skilltego/types";

export function toMessage(
  row: MessageRow,
  sender: AuthorSummary,
  reactions: MessageReactionSummary[] = [],
): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender,
    body: row.is_deleted ? null : row.body,
    attachment: row.is_deleted ? null : row.attachment,
    isEdited: row.is_edited,
    isDeleted: row.is_deleted,
    reactions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toNotification(row: NotificationRow, actor: AuthorSummary): Notification {
  return {
    id: row.id,
    type: row.type,
    actor,
    entityType: row.entity_type,
    entityId: row.entity_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}
