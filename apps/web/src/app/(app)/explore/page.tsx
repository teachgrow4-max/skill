import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getFeedAction } from "@/features/posts/actions";
import { ExploreContent } from "@/features/explore/components/explore-content";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { posts } = await getFeedAction("trending", null);

  return <ExploreContent trendingPosts={posts} isLoggedIn={Boolean(user)} currentUserId={user?.id ?? null} />;
}
