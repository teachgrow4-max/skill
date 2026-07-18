"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Badge, Button } from "@skilltego/ui";
import { formatRelativeTime } from "@skilltego/utils";
import type { PostRow } from "@skilltego/types";
import { deletePostAsAdminAction } from "../actions";

export function PostsPanel({ initialPosts }: { initialPosts: PostRow[] }) {
  const [posts, setPosts] = React.useState(initialPosts);

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await deletePostAsAdminAction(id);
  }

  return (
    <div className="grid gap-2">
      {posts.map((post) => (
        <div key={post.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
          <Badge variant="outline" className="shrink-0 capitalize">
            {post.type}
          </Badge>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              {post.caption ||
                post.code_snippet ||
                post.github_url ||
                post.project_url ||
                "(no text content)"}
            </p>
            <p className="text-xs text-muted-foreground">
              {post.like_count} likes · {post.comment_count} comments · {formatRelativeTime(post.created_at)}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => handleDelete(post.id)} aria-label="Delete post">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
