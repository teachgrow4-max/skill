import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminPostsAction, getAdminStatsAction } from "@/features/admin/actions";
import { PostsPanel } from "@/features/admin/components/posts-panel";
import { AdminNav } from "@/features/admin/components/admin-nav";

export const metadata: Metadata = { title: "Admin — Posts" };

export default async function AdminPostsPage() {
  const stats = await getAdminStatsAction();
  if (!stats) notFound();

  const posts = await getAdminPostsAction();

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Posts</h1>
        <AdminNav />
      </div>
      <PostsPanel initialPosts={posts} />
    </div>
  );
}
