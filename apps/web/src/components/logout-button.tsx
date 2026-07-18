"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@skilltego/auth";
import { Button } from "@skilltego/ui";
import { createClient } from "@/lib/supabase/browser";

export function LogoutButton({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleLogout() {
    setPending(true);
    const supabase = createClient();
    await signOut(supabase);
    router.push("/");
    router.refresh();
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={pending}
        onClick={handleLogout}
        aria-label="Log out"
        className="w-full justify-start gap-3 xl:w-auto xl:justify-center"
      >
        <LogOut className="size-5 shrink-0" />
        <span className="hidden xl:inline">{pending ? "Logging out…" : "Log out"}</span>
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" disabled={pending} onClick={handleLogout}>
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
