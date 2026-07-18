import type { Metadata } from "next";
import { listOpportunitiesAction } from "@/features/opportunities/actions";
import { OpportunitiesBrowser } from "@/features/opportunities/components/opportunities-browser";

export const metadata: Metadata = { title: "Opportunities" };

export default async function OpportunitiesPage() {
  const { opportunities } = await listOpportunitiesAction({}, 0);

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Opportunities</h1>
      <OpportunitiesBrowser initialOpportunities={opportunities} />
    </div>
  );
}
