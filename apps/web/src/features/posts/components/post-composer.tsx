"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Code2, Github, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Button, Input, Textarea } from "@skilltego/ui";
import { skillCategories } from "@skilltego/config";
import { cn } from "@skilltego/utils";
import { trackEvent } from "@/providers/posthog-provider";
import { AiSuggestButton } from "@/features/ai/components/ai-suggest-button";
import { createPostSchema, type CreatePostInput } from "../schema";
import { createPostAction } from "../actions";
import { MediaUploader } from "./media-uploader";

const MODES = [
  { type: "image" as const, label: "Post", icon: ImageIcon },
  { type: "code" as const, label: "Code", icon: Code2 },
  { type: "github_link" as const, label: "GitHub", icon: Github },
  { type: "project_link" as const, label: "Project", icon: LinkIcon },
];

export function PostComposer() {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostInput>({
    defaultValues: {
      type: "image",
      caption: "",
      codeLanguage: "",
      codeSnippet: "",
      skillCategory: "",
      tags: [],
      location: "",
      media: [],
      githubUrl: "",
      projectUrl: "",
      status: "published",
      scheduledAt: "",
      hideLikeCount: false,
    },
  });

  const type = watch("type");

  function resolveFinalType(values: CreatePostInput): CreatePostInput["type"] {
    if (values.type !== "image") return values.type;
    if (values.media.length > 1) return "carousel";
    if (values.media.length === 1) return values.media[0].type;
    return "text";
  }

  async function onSubmit(values: CreatePostInput) {
    setFormError(null);
    const finalValues: CreatePostInput = { ...values, type: resolveFinalType(values) };

    const parsed = createPostSchema.safeParse(finalValues);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof CreatePostInput, { message: issue.message });
        }
      }
      setFormError(parsed.error.issues[0]?.message ?? "Please fix the errors above.");
      return;
    }

    const result = await createPostAction(parsed.data);
    if (!result.success) {
      setFormError(result.error ?? "Could not create post.");
      return;
    }

    trackEvent("post_created", { type: parsed.data.type });

    reset();
    setExpanded(false);
    router.refresh();
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="glass w-full rounded-xl px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/40"
      >
        Share a skill, project, or update…
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass grid gap-4 rounded-xl p-4">
      <div className="flex gap-2 overflow-x-auto">
        {MODES.map((mode) => (
          <Controller
            key={mode.type}
            name="type"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(mode.type)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  type === mode.type ||
                    (mode.type === "image" && !["code", "github_link", "project_link"].includes(type))
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                <mode.icon className="size-3.5" />
                {mode.label}
              </button>
            )}
          />
        ))}
      </div>

      <Textarea placeholder="What did you build, learn, or achieve?" rows={3} {...register("caption")} />
      {errors.caption && <p className="text-xs text-destructive">{errors.caption.message}</p>}

      <AiSuggestButton
        label="Suggest a caption"
        system="You write short, engaging first-person social captions (2-3 sentences) for a skill-showcase platform called Skilltego. No hashtags, no quotes, no markdown — just the caption text."
        getPrompt={() =>
          `Write a caption for a ${getValues("type")} post${getValues("skillCategory") ? ` about ${getValues("skillCategory")}` : ""}. ${getValues("caption") ? `Build on this draft: "${getValues("caption")}"` : "Keep it general and inviting."}`
        }
        onResult={(text) => setValue("caption", text, { shouldDirty: true })}
      />

      {!["code", "github_link", "project_link"].includes(type) && (
        <Controller
          name="media"
          control={control}
          render={({ field }) => <MediaUploader value={field.value} onChange={field.onChange} />}
        />
      )}

      {type === "code" && (
        <div className="grid gap-2">
          <Input placeholder="Language (e.g. TypeScript)" {...register("codeLanguage")} />
          <Textarea
            placeholder="Paste your code snippet"
            rows={8}
            className="font-mono text-xs"
            {...register("codeSnippet")}
          />
          {errors.codeSnippet && <p className="text-xs text-destructive">{errors.codeSnippet.message}</p>}
        </div>
      )}

      {type === "github_link" && (
        <div>
          <Input placeholder="https://github.com/you/project" {...register("githubUrl")} />
          {errors.githubUrl && <p className="text-xs text-destructive">{errors.githubUrl.message}</p>}
        </div>
      )}

      {type === "project_link" && (
        <div>
          <Input placeholder="https://your-project.com" {...register("projectUrl")} />
          {errors.projectUrl && <p className="text-xs text-destructive">{errors.projectUrl.message}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <select
          className="h-10 rounded-md border border-input bg-background px-2 text-sm"
          {...register("skillCategory")}
        >
          <option value="">Skill category</option>
          {skillCategories.map((category) => (
            <optgroup key={category.slug} label={category.name}>
              {category.subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Input placeholder="Location (optional)" {...register("location")} />
      </div>

      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <Input
            key={field.value.join(",")}
            placeholder="Tags, comma separated"
            defaultValue={field.value.join(", ")}
            onBlur={(e) =>
              field.onChange(
                e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .slice(0, 10),
              )
            }
          />
        )}
      />

      <AiSuggestButton
        label="Suggest tags"
        system="You suggest 3-5 short, lowercase, single-word or hyphenated tags for a social post about a skill or project. Respond with only the tags, comma separated, nothing else."
        getPrompt={() =>
          `Suggest tags for this post: "${getValues("caption") || getValues("codeSnippet") || getValues("skillCategory") || "a skill showcase"}"`
        }
        disabled={!getValues("caption") && !getValues("codeSnippet") && !getValues("skillCategory")}
        onResult={(text) =>
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
          )
        }
      />

      <label className="flex w-fit items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" className="size-4" {...register("hideLikeCount")} />
        Hide like count on this post
      </label>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setExpanded(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
