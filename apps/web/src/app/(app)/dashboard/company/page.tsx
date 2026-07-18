import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileById } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { getMyOpportunitiesAction } from "@/features/opportunities/actions";
import { OpportunityForm } from "@/features/opportunities/components/opportunity-form";
import { MyOpportunitiesList } from "@/features/opportunities/components/my-opportunities-list";
import { COMPANY_KINDS } from "@/features/opportunities/schema";
import { getMyVerificationRequestsAction } from "@/features/verification/actions";
import { VerificationCard } from "@/features/verification/components/verification-card";
import { TalentSearch } from "@/features/talent/components/talent-search";
import { getMyBookmarkedCandidatesAction } from "@/features/talent/actions";
import { CandidateCard } from "@/features/talent/components/candidate-card";

export const metadata: Metadata = { title: "Company dashboard" };

export default async function CompanyDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const profile = await getProfileById(supabase, user.id);
  if (!profile || profile.account_type !== "company") notFound();

  const [opportunities, verificationRequests, bookmarkedCandidates] = await Promise.all([
    getMyOpportunitiesAction(),
    getMyVerificationRequestsAction(),
    getMyBookmarkedCandidatesAction(),
  ]);

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-bold">Company dashboard</h1>

      <VerificationCard isVerified={profile.is_verified} latestRequest={verificationRequests[0] ?? null} />

      <section>
        <h2 className="mb-2 text-lg font-semibold">Post a job or internship</h2>
        <OpportunityForm allowedKinds={COMPANY_KINDS} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Your postings</h2>
        <MyOpportunitiesList initialOpportunities={opportunities} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Search talent</h2>
        <TalentSearch />
      </section>

      {bookmarkedCandidates.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Bookmarked candidates</h2>
          <div className="grid gap-2">
            {bookmarkedCandidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} initialBookmarked />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
