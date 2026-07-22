import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getProfileById } from "@skilltego/database";
import { siteConfig } from "@skilltego/config";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ProfileMenu } from "./profile-menu";

export async function AppTopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfileById(supabase, user.id) : null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
      <Link href="/feed" className="text-gradient-brand text-lg font-black tracking-tight">
        {siteConfig.name}
      </Link>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Link
          href="/messages"
          aria-label="Messages"
          className="rounded-full p-2 text-foreground hover:bg-accent"
        >
          <MessageCircle className="size-5" />
        </Link>
        {profile && (
          <ProfileMenu
            username={profile.username}
            fullName={profile.full_name}
            avatarUrl={profile.avatar_url}
            className="rounded-full p-2"
          />
        )}
      </div>
    </header>
  );
}
