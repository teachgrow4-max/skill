import { getProfileById } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { BottomNavTabs } from "./bottom-nav-tabs";

export async function AppBottomNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfileById(supabase, user.id) : null;

  return (
    <BottomNavTabs
      username={profile?.username ?? null}
      fullName={profile?.full_name ?? ""}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}
