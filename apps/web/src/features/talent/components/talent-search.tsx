"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@skilltego/ui";
import type { ProfileRow } from "@skilltego/types";
import { useDebouncedSearch } from "@/features/search/hooks/use-debounced-search";
import { searchTalentAction } from "../actions";
import { CandidateCard } from "./candidate-card";

const EMPTY_RESULTS: ProfileRow[] = [];

export function TalentSearch() {
  const [query, setQuery] = React.useState("");
  const { data, loading, error } = useDebouncedSearch(query, searchTalentAction, {
    emptyValue: EMPTY_RESULTS,
  });
  const results = query.trim().length < 2 ? null : data;

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

      {!loading && error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && results && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No matches.</p>
      )}

      {!loading && !error && results && (
        <div className="grid gap-2">
          {results.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}
