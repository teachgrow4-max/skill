"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Input } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import { searchAction } from "@/features/search/actions";
import { useDebouncedSearch } from "@/features/search/hooks/use-debounced-search";
import { startConversationAction } from "../actions";
import type { AuthorSummary } from "@skilltego/types";

const EMPTY_RESULTS: AuthorSummary[] = [];

export function NewMessageModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [starting, setStarting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const { data: results, error: searchError } = useDebouncedSearch(
    query,
    async (q) => (await searchAction(q)).profiles,
    { delayMs: 300, emptyValue: EMPTY_RESULTS },
  );

  async function handleSelect(profile: AuthorSummary) {
    setError(null);
    setStarting(profile.id);
    const result = await startConversationAction(profile.id);
    setStarting(null);

    if (!result.success || !result.data) {
      setError(result.error ?? "Could not start conversation.");
      return;
    }

    onClose();
    router.push(`/messages/${result.data.conversationId}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass w-full max-w-sm rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">New message</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <Input
          autoFocus
          placeholder="Search people…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="mt-2 grid max-h-64 gap-1 overflow-y-auto">
          {results.map((profile) => (
            <button
              key={profile.id}
              type="button"
              disabled={starting !== null}
              onClick={() => handleSelect(profile)}
              className="flex items-center gap-2 rounded-lg p-1.5 text-left hover:bg-accent disabled:opacity-60"
            >
              <Avatar className="size-8">
                <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.fullName} />
                <AvatarFallback className="text-xs">{initials(profile.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm">{profile.fullName}</p>
                <p className="text-xs text-muted-foreground">@{profile.username}</p>
              </div>
              {starting === profile.id && <span className="ml-auto text-xs text-muted-foreground">Starting…</span>}
            </button>
          ))}
        </div>

        {searchError && <p className="mt-2 text-xs text-destructive">{searchError}</p>}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
