import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CreatePostFab } from "@/features/posts/components/create-post-fab";
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
      <FeedList isLoggedIn={Boolean(user)} currentUserId={user?.id ?? null} />
      <CreatePostFab />
    </div>
  );
}
