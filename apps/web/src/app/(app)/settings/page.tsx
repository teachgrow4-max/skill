import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Lock, Palette } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PushNotificationToggle } from "@/features/push/components/push-notification-toggle";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="grid gap-3">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <Palette className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Appearance</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <PushNotificationToggle />

        <Link
          href="/settings/privacy"
          className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/40"
        >
          <div className="flex items-center gap-3">
            <Lock className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Privacy</p>
              <p className="text-xs text-muted-foreground">Control who can see your posts and profile.</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/help"
          className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/40"
        >
          <div>
            <p className="text-sm font-medium">Help & Support</p>
            <p className="text-xs text-muted-foreground">FAQs and ways to reach us.</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
