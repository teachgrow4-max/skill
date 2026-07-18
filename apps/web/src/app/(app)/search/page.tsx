import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SearchPanel } from "@/features/search/components/search-panel";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <SearchPanel isLoggedIn={Boolean(user)} currentUserId={user?.id ?? null} />;
}
