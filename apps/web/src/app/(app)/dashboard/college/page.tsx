import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileById } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { getMyOpportunitiesAction } from "@/features/opportunities/actions";
import { OpportunityForm } from "@/features/opportunities/components/opportunity-form";
import { MyOpportunitiesList } from "@/features/opportunities/components/my-opportunities-list";
import { COLLEGE_KINDS } from "@/features/opportunities/schema";
import { getMyVerificationRequestsAction } from "@/features/verification/actions";
import { VerificationCard } from "@/features/verification/components/verification-card";
import { TalentSearch } from "@/features/talent/components/talent-search";

export const metadata: Metadata = { title: "College dashboard" };

export default async function CollegeDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const profile = await getProfileById(supabase, user.id);
  if (!profile || profile.account_type !== "college") notFound();

  const [opportunities, verificationRequests] = await Promise.all([
    getMyOpportunitiesAction(),
    getMyVerificationRequestsAction(),
  ]);

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-bold">College dashboard</h1>

      <VerificationCard isVerified={profile.is_verified} latestRequest={verificationRequests[0] ?? null} />

      <section>
        <h2 className="mb-2 text-lg font-semibold">Post a competition, event, or scholarship</h2>
        <OpportunityForm allowedKinds={COLLEGE_KINDS} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Your postings</h2>
        <MyOpportunitiesList initialOpportunities={opportunities} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Discover students</h2>
        <p className="mb-2 text-sm text-muted-foreground">
          Search by skill to find students to invite or spotlight.
        </p>
        <TalentSearch />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Announcements</h2>
        <p className="text-sm text-muted-foreground">
          Post announcements to your followers from the regular post composer on your{" "}
          <a href="/feed" className="text-primary hover:underline">
            Feed
          </a>
          .
        </p>
      </section>
    </div>
  );
}
