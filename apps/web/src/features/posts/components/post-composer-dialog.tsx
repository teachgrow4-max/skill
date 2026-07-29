"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { Button, Input, Sheet, SheetContent, SheetHeader, SheetTitle, Textarea } from "@skilltego/ui";
import { skillCategories } from "@skilltego/config";
import { cn } from "@skilltego/utils";
import { trackEvent } from "@/providers/posthog-provider";
import { CoinToast } from "@/features/gamification/components/coin-toast";
import { useCoinToast } from "@/features/gamification/hooks/use-coin-toast";
import { createPostSchema, type CreatePostInput } from "../schema";
import { createPostAction } from "../actions";
import { MediaUploader } from "./media-uploader";
import { PostTypeSelector, type TypeCardKey } from "./post-type-selector";
import { ComposerAiPopup } from "./composer-ai-popup";
import { useAutoResizeTextarea } from "../hooks/use-auto-resize-textarea";

interface PostComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostComposerDialog({ open, onOpenChange }: PostComposerDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [selectedCard, setSelectedCard] = React.useState<TypeCardKey>("photo");
  const [moreOpen, setMoreOpen] = React.useState(false);
  const { toast, showToast } = useCoinToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setError,
    setValue,
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
  const caption = watch("caption");
  const values = useWatch({ control });

  function resolveFinalType(values: CreatePostInput): CreatePostInput["type"] {
    if (values.type !== "image") return values.type;
    if (values.media.length > 1) return "carousel";
    if (values.media.length === 1) return values.media[0].type;
    return "text";
  }

  const canSubmit = React.useMemo(
    () =>
      createPostSchema.safeParse({ ...values, type: resolveFinalType(values as CreatePostInput) }).success,
    [values],
  );

  const captionRef = useAutoResizeTextarea(caption ?? "");
  const { ref: rhfCaptionRef, ...captionField } = register("caption");

  async function submitPost(values: CreatePostInput, status: CreatePostInput["status"]) {
    setFormError(null);
    const finalValues: CreatePostInput = { ...values, type: resolveFinalType(values), status };

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

    trackEvent("post_created", { type: parsed.data.type, status });

    if (result.coinsAwarded) {
      showToast({
        icon: "🎥",
        title: `+${result.coinsAwarded} Skill Coins`,
        subtitle: "Congratulations! You posted your first reel.",
      });
    }

    reset();
    setSelectedCard("photo");
    setMoreOpen(false);
    onOpenChange(false);
    router.refresh();
  }

  const onSubmit = (values: CreatePostInput) => submitPost(values, "published");
  const handleSaveDraft = handleSubmit((values) => submitPost(values, "draft"));

  return (
    <>
      <CoinToast toast={toast} />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="max-w-lg">
          <SheetHeader>
            <SheetTitle>Create New</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <PostTypeSelector
              activeCard={selectedCard}
              onSelect={(card) => {
                setSelectedCard(card.key);
                setValue("type", card.formType, { shouldDirty: true });
              }}
            />

            <div className="relative">
              <Textarea
                {...captionField}
                ref={(el) => {
                  rhfCaptionRef(el);
                  captionRef.current = el;
                }}
                placeholder="What did you build, learn, or achieve?"
                rows={2}
                className="resize-none overflow-hidden pr-10"
              />
              <div className="absolute bottom-2 right-2">
                <ComposerAiPopup values={values as CreatePostInput} setValue={setValue} />
              </div>
            </div>
            {errors.caption && <p className="text-xs text-destructive">{errors.caption.message}</p>}

            {!["code", "github_link", "project_link"].includes(type) && selectedCard !== "text" && (
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
                {errors.codeSnippet && (
                  <p className="text-xs text-destructive">{errors.codeSnippet.message}</p>
                )}
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

            <div>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                More options
                <ChevronDown className={cn("size-4 transition-transform", moreOpen && "rotate-180")} />
              </button>

              {moreOpen && (
                <div className="mt-3 grid gap-3">
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

                  <label className="flex w-fit items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" className="size-4" {...register("hideLikeCount")} />
                    Hide like count on this post
                  </label>
                </div>
              )}
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || !canSubmit}
                onClick={handleSaveDraft}
              >
                Save as draft
              </Button>
              <Button type="submit" disabled={isSubmitting || !canSubmit}>
                {isSubmitting ? "Posting…" : "Post"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
