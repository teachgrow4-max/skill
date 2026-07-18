"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Button, Input } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import { searchAction } from "@/features/search/actions";
import { createGroupChatAction } from "../actions";
import type { AuthorSummary } from "@skilltego/types";

export function NewGroupModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AuthorSummary[]>([]);
  const [selected, setSelected] = React.useState<AuthorSummary[]>([]);
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const data = await searchAction(query);
      setResults(data.profiles);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  function toggleSelect(profile: AuthorSummary) {
    setSelected((prev) =>
      prev.some((p) => p.id === profile.id) ? prev.filter((p) => p.id !== profile.id) : [...prev, profile],
    );
  }

  async function handleCreate() {
    setError(null);
    setCreating(true);
    const result = await createGroupChatAction(
      selected.map((p) => p.id),
      title,
    );
    setCreating(false);

    if (!result.success || !result.data) {
      setError(result.error ?? "Could not create group.");
      return;
    }

    onClose();
    router.push(`/messages/${result.data.conversationId}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass w-full max-w-sm rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">New group</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <Input
          placeholder="Group name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2"
        />

        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selected.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleSelect(p)}
                className="flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs"
              >
                {p.fullName} <X className="size-3" />
              </button>
            ))}
          </div>
        )}

        <Input placeholder="Search people to add…" value={query} onChange={(e) => setQuery(e.target.value)} />

        <div className="mt-2 grid max-h-48 gap-1 overflow-y-auto">
          {results.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => toggleSelect(profile)}
              className="flex items-center gap-2 rounded-lg p-1.5 text-left hover:bg-accent"
            >
              <Avatar className="size-7">
                <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.fullName} />
                <AvatarFallback className="text-xs">{initials(profile.fullName)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{profile.fullName}</span>
            </button>
          ))}
        </div>

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <Button
          className="mt-4 w-full"
          disabled={selected.length < 2 || !title.trim() || creating}
          onClick={handleCreate}
        >
          {creating ? "Creating…" : "Create group"}
        </Button>
      </div>
    </div>
  );
}
