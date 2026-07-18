"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@skilltego/ui";
import { generateWithOllama } from "@/lib/ollama";

interface AiSuggestButtonProps {
  label: string;
  system: string;
  getPrompt: () => string;
  disabled?: boolean;
  onResult: (text: string) => void;
}

export function AiSuggestButton({ label, system, getPrompt, disabled, onResult }: AiSuggestButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const text = await generateWithOllama(getPrompt(), system);
      onResult(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-1">
      <Button
        type="button"
        variant="glass"
        size="sm"
        className="w-fit"
        disabled={disabled || loading}
        onClick={handleClick}
      >
        <Sparkles className="size-3.5" />
        {loading ? "Thinking…" : label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
