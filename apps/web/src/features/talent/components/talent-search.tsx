"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@skilltego/ui";
import type { ProfileRow } from "@skilltego/types";
import { searchTalentAction } from "../actions";
import { CandidateCard } from "./candidate-card";

export function TalentSearch() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ProfileRow[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const data = await searchTalentAction(query);
      setResults(data);
      setLoading(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by skill (e.g. React, Photography)…"
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && results && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No matches.</p>
      )}

      {!loading && results && (
        <div className="grid gap-2">
          {results.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}
