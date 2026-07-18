import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfileById, getProfileSkills, toProfile } from "@skilltego/database";
import { siteConfig } from "@skilltego/config";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/profile/components/profile-form";

export const metadata: Metadata = { title: "Complete your profile" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profileRow = await getProfileById(supabase, user.id);
  if (!profileRow) redirect("/login");

  if (profileRow.onboarding_completed) {
    redirect(`/profile/${profileRow.username}`);
  }

  const skills = await getProfileSkills(supabase, user.id);
  const profile = toProfile(profileRow, skills);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-16">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome to {siteConfig.name}</h1>
        <p className="text-muted-foreground">Set up your profile so companies, mentors, and colleges can find you.</p>
      </div>
      <ProfileForm profile={profile} mode="onboarding" />
    </div>
  );
}
