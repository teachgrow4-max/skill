import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfileById, getProfileSkills, toProfile } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { PushNotificationToggle } from "@/features/push/components/push-notification-toggle";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profileRow = await getProfileById(supabase, user.id);
  if (!profileRow) redirect("/login");

  const skills = await getProfileSkills(supabase, user.id);
  const profile = toProfile(profileRow, skills);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Edit profile</h1>
      <PushNotificationToggle />
      <ProfileForm profile={profile} mode="edit" />
    </div>
  );
}
