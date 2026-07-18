import Link from "next/link";
import { getProfileById } from "@skilltego/database";
import { DASHBOARD_ACCOUNT_TYPES, siteConfig } from "@skilltego/config";
import { Avatar, AvatarFallback, AvatarImage } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { NavLink } from "./app-nav-links";
import { PRIMARY_NAV, type NavLinkItem } from "./app-nav-items";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

export async function AppSidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfileById(supabase, user.id) : null;
  const showDashboard =
    profile && (DASHBOARD_ACCOUNT_TYPES as readonly string[]).includes(profile.account_type);
  const showModeration =
    profile && (profile.account_type === "admin" || profile.account_type === "moderator");
  const showAdmin = profile?.account_type === "admin";

  const roleLinks: NavLinkItem[] = [
    ...(showDashboard ? [{ href: "/dashboard", label: "Dashboard", icon: "dashboard" as const }] : []),
    ...(showModeration ? [{ href: "/moderation", label: "Moderation", icon: "moderation" as const }] : []),
    ...(showAdmin ? [{ href: "/admin", label: "Admin", icon: "admin" as const }] : []),
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r border-border bg-background/80 backdrop-blur-xl md:flex xl:w-64">
      <Link href="/feed" className="flex items-center gap-2 px-4 py-6">
        <span className="text-gradient-brand text-xl font-black tracking-tight">S</span>
        <span className="text-gradient-brand hidden text-lg font-black tracking-tight xl:inline">
          {siteConfig.name}
        </span>
      </Link>

      <nav className="grid gap-1 px-3">
        <div className="flex items-center gap-3 rounded-xl px-1 py-1 text-muted-foreground">
          <NotificationBell />
          <span className="hidden text-sm font-medium xl:inline">Notifications</span>
        </div>
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        {roleLinks.length > 0 && (
          <>
            <div className="my-2 h-px bg-border" />
            {roleLinks.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      <div className="mt-auto grid gap-2 px-3 pb-6">
        {profile && (
          <Link
            href={`/profile/${profile.username}`}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          >
            <Avatar className="size-6">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
              <AvatarFallback className="text-[10px]">{initials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <span className="hidden truncate xl:inline">{profile.full_name}</span>
          </Link>
        )}
        <div className="flex items-center gap-2 px-3">
          <ThemeToggle />
          <LogoutButton compact />
        </div>
      </div>
    </aside>
  );
}
