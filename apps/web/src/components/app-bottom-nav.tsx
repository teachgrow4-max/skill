import { getCurrentProfile } from "@/lib/supabase/get-current-user";
import { BottomNavTabs } from "./bottom-nav-tabs";

export async function AppBottomNav() {
  const profile = await getCurrentProfile();

  return (
    <BottomNavTabs
      username={profile?.username ?? null}
      fullName={profile?.full_name ?? ""}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}
