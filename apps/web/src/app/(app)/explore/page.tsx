import type { Metadata } from "next";
import Link from "next/link";
import { skillCategories } from "@skilltego/config";
import { Badge } from "@skilltego/ui";
import { createClient } from "@/lib/supabase/server";
import { getFeedAction } from "@/features/posts/actions";
import { PostCard } from "@/features/posts/components/post-card";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { posts } = await getFeedAction("trending", null);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="mb-3 text-lg font-semibold">Browse categories</h1>
        <div className="flex flex-wrap gap-2">
          {skillCategories.flatMap((category) => category.subcategories).map((sub) => (
            <Link key={sub} href={`/search?category=${encodeURIComponent(sub)}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                {sub}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Trending this week</h2>
        <div className="grid gap-4">
          {posts.length === 0 && <p className="text-sm text-muted-foreground">Nothing trending yet.</p>}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} isLoggedIn={Boolean(user)} currentUserId={user?.id ?? null} />
          ))}
        </div>
      </div>
    </div>
  );
}
