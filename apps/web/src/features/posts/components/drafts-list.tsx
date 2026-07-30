"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send, Trash2 } from "lucide-react";
import { Button, EmptyState } from "@skilltego/ui";
import type { Post } from "@skilltego/types";
import { deletePostAction, publishDraftAction } from "../actions";

export function DraftsList({ drafts }: { drafts: Post[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function handlePublish(postId: string) {
    setPendingId(postId);
    await publishDraftAction(postId);
    setPendingId(null);
    router.refresh();
  }

  async function handleDelete(postId: string) {
    setPendingId(postId);
    await deletePostAction(postId);
    setPendingId(null);
    router.refresh();
  }

  if (drafts.length === 0) {
    return <EmptyState title="No drafts" description="Posts you save as a draft will show up here." />;
  }

  return (
    <div className="grid gap-3">
      {drafts.map((post) => {
        const thumb = post.media[0]?.url ?? post.thumbnailUrl;
        const pending = pendingId === post.id;
        return (
          <div key={post.id} className="glass flex items-center gap-3 rounded-xl p-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              {thumb ? (
                <Image src={thumb} alt="" fill quality={90} sizes="56px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center p-1 text-center text-[10px] text-muted-foreground">
                  {post.caption?.slice(0, 30) ?? "Draft"}
                </span>
              )}
            </div>
            <p className="flex-1 truncate text-sm text-muted-foreground">
              {post.caption || "No caption"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => handlePublish(post.id)}
            >
              <Send className="size-3.5" />
              Publish
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={pending}
              aria-label="Delete draft"
              onClick={() => handleDelete(post.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
