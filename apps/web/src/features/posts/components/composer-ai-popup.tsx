"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { UseFormSetValue } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@skilltego/ui";
import { generateWithOllama } from "@/lib/ollama";
import type { CreatePostInput } from "../schema";

interface AiPreset {
  key: string;
  label: string;
  system: string;
  getPrompt: (values: CreatePostInput) => string;
  disabled?: (values: CreatePostInput) => boolean;
  apply: (text: string, setValue: UseFormSetValue<CreatePostInput>) => void;
}

const PRESETS: AiPreset[] = [
  {
    key: "caption",
    label: "Generate caption",
    system:
      "You write short, engaging first-person social captions (2-3 sentences) for a skill-showcase platform called Skilltego. No hashtags, no quotes, no markdown — just the caption text.",
    getPrompt: (values) =>
      `Write a caption for a ${values.type} post${values.skillCategory ? ` about ${values.skillCategory}` : ""}. ${
        values.caption ? `Build on this draft: "${values.caption}"` : "Keep it general and inviting."
      }`,
    apply: (text, setValue) => setValue("caption", text, { shouldDirty: true }),
  },
  {
    key: "improve",
    label: "Improve writing",
    system:
      "You improve a social post caption's flow, word choice, and clarity while preserving its meaning and roughly its length. Respond with only the improved caption, no quotes or commentary.",
    getPrompt: (values) => `Improve this caption: "${values.caption}"`,
    disabled: (values) => !values.caption,
    apply: (text, setValue) => setValue("caption", text, { shouldDirty: true }),
  },
  {
    key: "shorten",
    label: "Shorten",
    system:
      "You shorten a social post caption to its most essential, punchy form while keeping its core meaning. Respond with only the shortened caption, no quotes or commentary.",
    getPrompt: (values) => `Shorten this caption: "${values.caption}"`,
    disabled: (values) => !values.caption,
    apply: (text, setValue) => setValue("caption", text, { shouldDirty: true }),
  },
  {
    key: "expand",
    label: "Expand",
    system:
      "You expand a social post caption into a fuller, more engaging 2-4 sentence version, staying on topic. Respond with only the expanded caption, no quotes or commentary.",
    getPrompt: (values) => `Expand this caption: "${values.caption}"`,
    disabled: (values) => !values.caption,
    apply: (text, setValue) => setValue("caption", text, { shouldDirty: true }),
  },
  {
    key: "grammar",
    label: "Fix grammar",
    system:
      "You fix grammar, spelling, and punctuation only — do not change tone, meaning, or add content. Respond with only the corrected text, no quotes or commentary.",
    getPrompt: (values) => `Fix grammar in this caption: "${values.caption}"`,
    disabled: (values) => !values.caption,
    apply: (text, setValue) => setValue("caption", text, { shouldDirty: true }),
  },
  {
    key: "tags",
    label: "Generate tags",
    system:
      "You suggest 3-5 short, lowercase, single-word or hyphenated tags for a social post about a skill or project. Respond with only the tags, comma separated, nothing else.",
    getPrompt: (values) =>
      `Suggest tags for this post: "${values.caption || values.codeSnippet || values.skillCategory || "a skill showcase"}"`,
    disabled: (values) => !values.caption && !values.codeSnippet && !values.skillCategory,
    apply: (text, setValue) =>
      setValue(
        "tags",
        text
          .split(",")
          .map((t) =>
            t
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, ""),
          )
          .filter(Boolean)
          .slice(0, 10),
        { shouldDirty: true },
      ),
  },
];

interface ComposerAiPopupProps {
  values: CreatePostInput;
  setValue: UseFormSetValue<CreatePostInput>;
}

export function ComposerAiPopup({ values, setValue }: ComposerAiPopupProps) {
  const [open, setOpen] = React.useState(false);
  const [loadingKey, setLoadingKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run(preset: AiPreset) {
    setLoadingKey(preset.key);
    setError(null);
    try {
      const text = await generateWithOllama(preset.getPrompt(values), preset.system);
      preset.apply(text, setValue);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="AI writing tools"
          className="flex size-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm transition-colors hover:text-primary"
        >
          <Sparkles className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="grid gap-0.5">
        {PRESETS.map((preset) => {
          const isDisabled = preset.disabled?.(values) ?? false;
          return (
            <button
              key={preset.key}
              type="button"
              disabled={isDisabled || loadingKey !== null}
              onClick={() => run(preset)}
              className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {preset.label}
              {loadingKey === preset.key && <Loader2 className="size-3.5 animate-spin" />}
            </button>
          );
        })}
        {error && <p className="px-2.5 pt-1 text-xs text-destructive">{error}</p>}
      </PopoverContent>
    </Popover>
  );
}
