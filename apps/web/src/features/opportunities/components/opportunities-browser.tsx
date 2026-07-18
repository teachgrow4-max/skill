"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@skilltego/utils";
import type { Opportunity, OpportunityKind } from "@skilltego/types";
import { KIND_LABELS } from "../schema";
import { listOpportunitiesAction } from "../actions";
import { OpportunityCard } from "./opportunity-card";

const FILTERS: { label: string; kinds?: OpportunityKind[] }[] = [
  { label: "All" },
  { label: KIND_LABELS.job, kinds: ["job"] },
  { label: KIND_LABELS.internship, kinds: ["internship"] },
  { label: KIND_LABELS.competition, kinds: ["competition"] },
  { label: KIND_LABELS.event, kinds: ["event"] },
  { label: KIND_LABELS.scholarship, kinds: ["scholarship"] },
];

export function OpportunitiesBrowser({ initialOpportunities }: { initialOpportunities: Opportunity[] }) {
  const [filterIndex, setFilterIndex] = React.useState(0);
  const [opportunities, setOpportunities] = React.useState(initialOpportunities);
  const [loading, setLoading] = React.useState(false);

  async function handleFilterChange(index: number) {
    setFilterIndex(index);
    setLoading(true);
    const { opportunities: data } = await listOpportunitiesAction({ kinds: FILTERS[index].kinds }, 0);
    setOpportunities(data);
    setLoading(false);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter, index) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => handleFilterChange(index)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filterIndex === index
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && opportunities.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing here yet — check back soon.</p>
      )}

      {!loading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}
    </div>
  );
}
