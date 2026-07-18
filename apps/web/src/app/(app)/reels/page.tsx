import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReelsFeed } from "@/features/reels/components/reels-feed";

export const metadata: Metadata = { title: "Reels" };

export default async function ReelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ReelsFeed isLoggedIn={Boolean(user)} currentUserId={user?.id ?? null} />;
}
