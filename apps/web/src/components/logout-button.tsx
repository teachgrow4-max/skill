"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@skilltego/auth";
import { Button } from "@skilltego/ui";
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
    <Button type="button" variant="outline" disabled={pending} onClick={handleLogout}>
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
