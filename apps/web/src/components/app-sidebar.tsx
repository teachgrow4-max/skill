import Image from "next/image";
import Link from "next/link";
import { getProfileById } from "@skilltego/database";
import { DASHBOARD_ACCOUNT_TYPES, siteConfig } from "@skilltego/config";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { NavLink } from "./app-nav-links";
import { PRIMARY_NAV, type NavLinkItem } from "./app-nav-items";
import { ProfileMenu } from "./profile-menu";
import { SidebarBranding } from "./sidebar-branding";
import { SidebarFrame } from "./sidebar-frame";
import { SidebarLabel } from "./sidebar-label";
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
    <SidebarFrame>
      <Link href="/feed" className="flex items-center gap-2 px-4 py-6">
        <Image src="/logo.png" alt={siteConfig.name} width={32} height={32} className="rounded-lg" priority />
        <SidebarLabel className="text-gradient-brand text-lg font-black tracking-tight">
          {siteConfig.name}
        </SidebarLabel>
      </Link>

      <SidebarBranding />

      <nav className="grid gap-1 px-3">
        <div className="flex items-center gap-3 rounded-xl px-1 py-1 text-muted-foreground">
          <NotificationBell align="left" />
          <SidebarLabel className="text-sm font-medium">Notifications</SidebarLabel>
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
          <ProfileMenu
            username={profile.username}
            fullName={profile.full_name}
            avatarUrl={profile.avatar_url}
            align="start"
          />
        )}
        <div className="flex items-center gap-2 px-3">
          <ThemeToggle />
        </div>
      </div>
    </SidebarFrame>
  );
}
