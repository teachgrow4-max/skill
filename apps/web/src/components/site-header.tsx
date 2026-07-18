import Link from "next/link";
import { getProfileById } from "@skilltego/database";
import { siteConfig, marketingNav, appNav, DASHBOARD_ACCOUNT_TYPES } from "@skilltego/config";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { LogoutButton } from "./logout-button";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfileById(supabase, user.id) : null;
  const showDashboard = profile && (DASHBOARD_ACCOUNT_TYPES as readonly string[]).includes(profile.account_type);
  const navItems = profile
    ? showDashboard
      ? [...appNav, { title: "Dashboard", href: "/dashboard" }]
      : appNav
    : marketingNav;

  return (
    <header className="glass sticky top-0 z-40 w-full border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {profile ? (
            <>
              <NotificationBell />
              <Button asChild variant="ghost" size="icon" className="rounded-full">
                <Link href={`/profile/${profile.username}`} aria-label="Your profile">
                  <Avatar className="size-8">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
                    <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
                  </Avatar>
                </Link>
              </Button>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
