"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, EyeOff, Globe, MapPin, Settings2, X } from "lucide-react";
import { Button, Input, Sheet, SheetContent, SheetTitle, Textarea } from "@skilltego/ui";
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
import { TagsInput } from "./tags-input";
import { useAutoResizeTextarea } from "../hooks/use-auto-resize-textarea";

interface PostComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_ICON: Record<string, string> = {
  technology: "💻",
  design: "🎨",
  "performing-arts": "🎭",
  sports: "🏅",
  creative: "✍️",
  business: "📈",
  communication: "🗣️",
  academic: "📚",
  lifestyle: "🌿",
};

const CAPTION_MAX = 3000;

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
        <SheetContent hideClose className="flex flex-col gap-0 p-0 sm:max-w-[900px]">
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5 sm:px-8">
              <div>
                <SheetTitle className="text-xl tracking-tight">Create Post</SheetTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Share your work with the Skilltego community.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-6 sm:px-8">
              <PostTypeSelector
                activeCard={selectedCard}
                onSelect={(card) => {
                  setSelectedCard(card.key);
                  setValue("type", card.formType, { shouldDirty: true });
                }}
              />

              <div className="grid gap-1.5">
                <div className="relative rounded-2xl border border-input bg-background transition-colors focus-within:ring-2 focus-within:ring-ring">
                  <Textarea
                    {...captionField}
                    ref={(el) => {
                      rhfCaptionRef(el);
                      captionRef.current = el;
                    }}
                    placeholder="Write something amazing…"
                    rows={2}
                    maxLength={CAPTION_MAX}
                    className="min-h-[160px] resize-none overflow-hidden border-0 bg-transparent pb-8 pr-10 shadow-none focus-visible:ring-0"
                  />
                  <div className="absolute bottom-2.5 right-2.5">
                    <ComposerAiPopup values={values as CreatePostInput} setValue={setValue} />
                  </div>
                  <span className="pointer-events-none absolute bottom-3 left-4 text-xs text-muted-foreground">
                    {(caption ?? "").length}/{CAPTION_MAX}
                  </span>
                </div>
                {errors.caption && <p className="text-xs text-destructive">{errors.caption.message}</p>}
              </div>

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

              <div className="rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="size-4 text-muted-foreground" />
                    Post settings
                  </span>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", moreOpen && "rotate-180")} />
                </button>

                <AnimatePresence initial={false}>
                  {moreOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-4 border-t border-border px-4 py-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="relative">
                            <select
                              className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-8 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              {...register("skillCategory")}
                            >
                              <option value="">Category (optional)</option>
                              {skillCategories.map((category) => (
                                <optgroup
                                  key={category.slug}
                                  label={`${CATEGORY_ICON[category.slug] ?? "🏷️"} ${category.name}`}
                                >
                                  {category.subcategories.map((sub) => (
                                    <option key={sub} value={sub}>
                                      {sub}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          </div>

                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Add location (optional)"
                              className="h-11 rounded-xl pl-9"
                              {...register("location")}
                            />
                          </div>
                        </div>

                        <Controller
                          name="tags"
                          control={control}
                          render={({ field }) => <TagsInput value={field.value} onChange={field.onChange} />}
                        />

                        <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            {...register("hideLikeCount")}
                          />
                          <EyeOff className="size-3.5" />
                          Hide like count on this post
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>

            {/* Sticky footer */}
            <div className="flex shrink-0 flex-col-reverse items-stretch gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="size-3.5" />
                Anyone who can see your profile can view this
              </span>
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
                <Button
                  type="submit"
                  disabled={isSubmitting || !canSubmit}
                  className="gradient-brand border-0 text-primary-foreground shadow-glow"
                >
                  {isSubmitting ? "Posting…" : "Publish post"}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
