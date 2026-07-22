import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfileById } from "@skilltego/database";
import { DASHBOARD_ACCOUNT_TYPES } from "@skilltego/config";
import { EmptyState } from "@skilltego/ui";
import { createClient } from "@/lib/supabase/server";
import { getMyOpportunitiesAction, getMyApplicationsAction } from "@/features/opportunities/actions";
import { MyOpportunitiesList } from "@/features/opportunities/components/my-opportunities-list";
import { OpportunityCard } from "@/features/opportunities/components/opportunity-card";

export const metadata: Metadata = { title: "My Opportunities" };

export default async function MyOpportunitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileById(supabase, user.id);
  if (!profile) redirect("/login");

  const canPost = (DASHBOARD_ACCOUNT_TYPES as readonly string[]).includes(profile.account_type);

  if (canPost) {
    const opportunities = await getMyOpportunitiesAction();
    return (
      <div className="grid gap-4">
        <h1 className="text-xl font-bold">My Opportunities</h1>
        <MyOpportunitiesList initialOpportunities={opportunities} />
      </div>
    );
  }

  const applications = await getMyApplicationsAction();
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">My Opportunities</h1>
      {applications.length === 0 ? (
        <EmptyState title="No applications yet" description="Opportunities you apply to will show up here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {applications.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}
    </div>
  );
}
