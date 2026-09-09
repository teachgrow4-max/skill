"use client";

import * as React from "react";

/**
 * Shares a post via the native share sheet where available, falling back to
 * copying a link to the clipboard. The link points at the post itself
 * (`/feed?post=<id>`) — the same deep-link convention push notifications
 * already use — not just the author's profile.
 */
export function useSharePost(postId: string) {
  const [linkCopied, setLinkCopied] = React.useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/feed?post=${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // user dismissed the native share sheet — nothing to do
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1500);
  }

  return { handleShare, linkCopied };
}
