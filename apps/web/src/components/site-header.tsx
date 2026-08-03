import Image from "next/image";
import Link from "next/link";
import { getProfileById } from "@skilltego/database";
import { siteConfig, marketingNav, appNav, DASHBOARD_ACCOUNT_TYPES } from "@skilltego/config";
import { Button } from "@skilltego/ui";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { ProfileMenu } from "./profile-menu";

export async function SiteHeader() {
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

  const navItems = profile
    ? [
        ...appNav,
        ...(showDashboard ? [{ title: "Dashboard", href: "/dashboard" }] : []),
        ...(showModeration ? [{ title: "Moderation", href: "/moderation" }] : []),
        ...(showAdmin ? [{ title: "Admin", href: "/admin" }] : []),
      ]
    : marketingNav;

  return (
    <header className="glass sticky top-0 z-40 w-full border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Image
            src="/logo.png"
            alt={siteConfig.name}
            width={28}
            height={28}
            className="rounded-lg"
            priority
          />
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {profile ? (
            <>
              <NotificationBell />
              <ProfileMenu
                username={profile.username}
                fullName={profile.full_name}
                avatarUrl={profile.avatar_url}
                className="rounded-full p-1"
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="h-9 px-2.5 sm:h-10 sm:px-4">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="h-9 px-3 sm:h-10 sm:px-4">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
