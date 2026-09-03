import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { FeedList } from "@/features/posts/components/feed-list";
import { StoriesBar } from "@/features/stories/components/stories-bar";

export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage() {
  const user = await getCurrentUser();

  return (
    <div className="grid gap-4">
      <StoriesBar currentUserId={user?.id ?? null} />
      <FeedList isLoggedIn={Boolean(user)} currentUserId={user?.id ?? null} />
    </div>
  );
}
