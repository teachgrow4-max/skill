"use client";

import * as React from "react";
import { X } from "lucide-react";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
}

export function TagsInput({ value, onChange, max = 10, placeholder = "Add a tag and press Enter" }: TagsInputProps) {
  const [draft, setDraft] = React.useState("");

  function commit(raw: string) {
    const tag = raw.trim().replace(/^#/, "");
    if (!tag || value.length >= max || value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-ring">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex animate-in items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground zoom-in-95 duration-150"
        >
          #{tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove ${tag}`}
            className="text-accent-foreground/70 hover:text-accent-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {value.length < max && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-28 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
}
