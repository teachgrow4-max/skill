"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/browser";

/**
 * Subscribes to realtime DELETE events on this user's notifications (e.g. a
 * post getting deleted cleans up its notifications server-side) and reports
 * each removed id so open notification UIs can drop it without a refresh.
 */
export function useNotificationDeleteSync(userId: string | null, onDeleted: (id: string) => void) {
  const onDeletedRef = React.useRef(onDeleted);
  onDeletedRef.current = onDeleted;

  React.useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-delete:${userId}`)
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const deletedId = (payload.old as { id?: string }).id;
          if (deletedId) onDeletedRef.current(deletedId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
