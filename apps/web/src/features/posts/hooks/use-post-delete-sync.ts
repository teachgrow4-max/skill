"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/browser";

/**
 * Subscribes to realtime DELETE events on posts so any feed/grid still
 * showing a post that's deleted elsewhere can drop it immediately — without
 * this, a user can end up liking/commenting on a post that's already gone,
 * which fails server-side with a foreign key violation.
 */
export function usePostDeleteSync(onDeleted: (id: string) => void) {
  const onDeletedRef = React.useRef(onDeleted);
  onDeletedRef.current = onDeleted;
  const instanceId = React.useId();

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`posts-delete:${instanceId}`)
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          const deletedId = (payload.old as { id?: string }).id;
          if (deletedId) onDeletedRef.current(deletedId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId]);
}
