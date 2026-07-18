import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBookmarkedPostsAction } from "@/features/posts/actions";
import { PostCard } from "@/features/posts/components/post-card";

export const metadata: Metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const posts = await getBookmarkedPostsAction();

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Bookmarks</h1>
      {posts.length === 0 && (
        <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
          Posts you save will show up here.
        </div>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} isLoggedIn={Boolean(user)} currentUserId={user?.id ?? null} />
      ))}
    </div>
  );
}
