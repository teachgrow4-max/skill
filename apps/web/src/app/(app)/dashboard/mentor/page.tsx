import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileById } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import {
  getMentorAvailabilityAction,
  getMentorReviewsAction,
  getMySessionsAction,
} from "@/features/mentorship/actions";
import { AvailabilityManager } from "@/features/mentorship/components/availability-manager";
import { SessionsList } from "@/features/mentorship/components/sessions-list";
import { MentorReviews } from "@/features/mentorship/components/mentor-reviews";
import { getMyVerificationRequestsAction } from "@/features/verification/actions";
import { VerificationCard } from "@/features/verification/components/verification-card";

export const metadata: Metadata = { title: "Mentor dashboard" };

export default async function MentorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const profile = await getProfileById(supabase, user.id);
  if (!profile || profile.account_type !== "mentor") notFound();

  const [slots, sessions, verificationRequests, reviewData] = await Promise.all([
    getMentorAvailabilityAction(user.id),
    getMySessionsAction("mentor"),
    getMyVerificationRequestsAction(),
    getMentorReviewsAction(user.id),
  ]);

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-bold">Mentor dashboard</h1>

      <VerificationCard isVerified={profile.is_verified} latestRequest={verificationRequests[0] ?? null} />

      <section>
        <h2 className="mb-2 text-lg font-semibold">Your availability</h2>
        <AvailabilityManager initialSlots={slots} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Session requests</h2>
        <SessionsList sessions={sessions} role="mentor" />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Your reviews</h2>
        <MentorReviews {...reviewData} />
      </section>
    </div>
  );
}
