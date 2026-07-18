import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { siteConfig } from "@skilltego/config";
import { NotificationBell } from "@/features/notifications/components/notification-bell";

export function AppTopBar() {
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
      </div>
    </header>
  );
}
