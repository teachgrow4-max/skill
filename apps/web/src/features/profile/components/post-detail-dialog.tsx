"use client";

import { Dialog, DialogContent, DialogTitle } from "@skilltego/ui";
import type { Post } from "@skilltego/types";
import { PostCard } from "@/features/posts/components/post-card";

interface PostDetailDialogProps {
  post: Post | null;
  isLoggedIn: boolean;
  currentUserId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function PostDetailDialog({ post, isLoggedIn, currentUserId, onOpenChange }: PostDetailDialogProps) {
  return (
    <Dialog open={post !== null} onOpenChange={onOpenChange}>
      {post && (
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Post by {post.author.fullName}</DialogTitle>
          <PostCard post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
        </DialogContent>
      )}
    </Dialog>
  );
}
