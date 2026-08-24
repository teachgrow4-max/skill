import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfileById } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountForm } from "@/features/auth/components/delete-account-form";

export const metadata: Metadata = { title: "Delete Account" };

export default async function DeleteAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileById(supabase, user.id);
  if (!profile) redirect("/login");

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Delete Account</h1>
      <DeleteAccountForm username={profile.username} />
    </div>
  );
}
