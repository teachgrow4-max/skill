import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, UserCheck } from "lucide-react";
import { getProfileById } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { PrivacyToggle } from "@/features/profile/components/privacy-toggle";

export const metadata: Metadata = { title: "Privacy" };

export default async function PrivacySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileById(supabase, user.id);
  if (!profile) redirect("/login");

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Privacy</h1>

      <div className="grid gap-3">
        <PrivacyToggle initialIsPrivate={profile.is_private} />

        <Link
          href="/follow-requests"
          className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/40"
        >
          <div className="flex items-center gap-3">
            <UserCheck className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Follow requests</p>
              <p className="text-xs text-muted-foreground">Review pending requests to follow you.</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
