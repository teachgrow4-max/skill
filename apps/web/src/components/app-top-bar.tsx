import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { siteConfig } from "@skilltego/config";
import { getCurrentProfile } from "@/lib/supabase/get-current-user";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ProfileMenu } from "./profile-menu";

export async function AppTopBar() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl md:hidden">
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
