import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PostComposer } from "@/features/posts/components/post-composer";
import { FeedList } from "@/features/posts/components/feed-list";
import { StoriesBar } from "@/features/stories/components/stories-bar";

export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="grid gap-4">
      <StoriesBar currentUserId={user?.id ?? null} />
      <PostComposer />
      <FeedList isLoggedIn={Boolean(user)} currentUserId={user?.id ?? null} />
    </div>
  );
}
