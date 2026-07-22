"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@skilltego/auth";
import { createClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleLogout() {
    setPending(true);
    const supabase = createClient();
    await signOut(supabase);
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
    >
      <LogOut className="size-4" />
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
