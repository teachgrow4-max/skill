"use client";

import * as React from "react";
import Image from "next/image";
import {
  Ban,
  BarChart3,
  Camera,
  GraduationCap,
  HelpCircle,
  Images,
  Loader2,
  SmilePlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button, Input, Sheet, SheetContent, SheetTitle, Textarea } from "@skilltego/ui";
import { cn } from "@skilltego/utils";
import { uploadStoryMedia, uploadVideoWithProgress } from "@/lib/supabase-storage";
import { UploadCancelledError } from "@/lib/resumable-upload";
import { resizeImage } from "@/lib/image-resize";
import { createStoryAction } from "../actions";
import type { CreateStoryInput } from "../schema";

type StickerChoice = CreateStoryInput["stickerType"];

const STICKERS: { value: StickerChoice; label: string; icon: LucideIcon }[] = [
  { value: "none", label: "None", icon: Ban },
  { value: "poll", label: "Poll", icon: BarChart3 },
  { value: "question", label: "Question", icon: HelpCircle },
  { value: "quiz", label: "Quiz", icon: GraduationCap },
  { value: "emoji_slider", label: "Emoji slider", icon: SmilePlus },
];

export function StoryCreator({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [cancelUpload, setCancelUpload] = React.useState<(() => void) | null>(null);
  const [media, setMedia] = React.useState<{ url: string; type: "image" | "video" } | null>(null);
  const [caption, setCaption] = React.useState("");
  const [sticker, setSticker] = React.useState<StickerChoice>("none");
  const [pollQuestion, setPollQuestion] = React.useState("");
  const [pollOptions, setPollOptions] = React.useState(["Yes", "No"]);
  const [questionPrompt, setQuestionPrompt] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      if (file.type.startsWith("video/")) {
        const handle = await uploadVideoWithProgress(file, "stories", (sent, total) => {
          setUploadProgress(total > 0 ? sent / total : 0);
        });
        setCancelUpload(() => handle.cancel);
        const result = await handle.result;
        setMedia({ url: result.url, type: "video" });
      } else {
        const resized = await resizeImage(file, 1600);
        const result = await uploadStoryMedia(resized);
        setMedia({ url: result.url, type: "image" });
      }
    } catch (uploadError) {
      if (!(uploadError instanceof UploadCancelledError)) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      }
    } finally {
      setUploading(false);
      setCancelUpload(null);
    }
  }

  function buildStickerData(): Record<string, unknown> {
    if (sticker === "poll") return { question: pollQuestion, options: pollOptions.filter(Boolean) };
    if (sticker === "question") return { prompt: questionPrompt };
    if (sticker === "quiz")
      return { question: pollQuestion, options: pollOptions.filter(Boolean), correctIndex: 0 };
    if (sticker === "emoji_slider") return { question: pollQuestion || "React!", emoji: "❤️" };
    return {};
  }

  async function handleSubmit() {
    if (!media) return;
    setSubmitting(true);
    setError(null);

    const result = await createStoryAction({
      mediaUrl: media.url,
      mediaType: media.type,
      caption,
      stickerType: sticker,
      stickerData: buildStickerData(),
    });

    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Could not post story.");
      return;
    }
    onCreated();
  }

  return (
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        hideClose
        style={{ background: "var(--color-card)" }}
        className="flex flex-col gap-0 p-0 sm:max-w-[380px]"
      >
        <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center border-b border-border px-2 py-3.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center justify-self-start rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-5" />
          </button>
          <SheetTitle className="text-center text-[15px] font-semibold">Create story</SheetTitle>
          <span aria-hidden className="size-9" />
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {!media ? (
            <div className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                Share a photo or video that disappears in 24 hours.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-secondary/60 px-4 py-6 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-accent text-foreground">
                    <Camera className="size-5" />
                  </span>
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-secondary/60 px-4 py-6 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-accent text-foreground">
                    <Images className="size-5" />
                  </span>
                  Gallery
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground">Photos and videos up to 25MB</p>

              {uploading && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {cancelUpload ? `Uploading… ${Math.round(uploadProgress * 100)}%` : "Uploading…"}
                  {cancelUpload && (
                    <button type="button" onClick={cancelUpload} className="font-medium text-destructive hover:underline">
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="relative mx-auto aspect-[9/16] max-h-[46vh] w-full max-w-[240px] overflow-hidden rounded-2xl bg-muted">
                {media.type === "image" ? (
                  <Image src={media.url} alt="" fill sizes="240px" className="object-cover" />
                ) : (
                  <video src={media.url} className="h-full w-full object-cover" muted autoPlay loop playsInline />
                )}
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  aria-label="Remove media"
                  className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <Textarea
                placeholder="Add a caption (optional)"
                rows={2}
                className="resize-none"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Add to your story</p>
                <div className="flex flex-wrap gap-2">
                  {STICKERS.map((s) => {
                    const isActive = sticker === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSticker(s.value)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          isActive
                            ? "gradient-brand border-transparent text-primary-foreground shadow-sm"
                            : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <s.icon className="size-3.5" />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(sticker === "poll" || sticker === "quiz") && (
                <div className="grid gap-2">
                  <Input
                    placeholder="Question"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                  />
                  <div className="flex gap-2">
                    {pollOptions.map((option, i) => (
                      <Input
                        key={i}
                        value={option}
                        onChange={(e) =>
                          setPollOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {sticker === "question" && (
                <Input
                  placeholder="Ask me anything…"
                  value={questionPrompt}
                  onChange={(e) => setQuestionPrompt(e.target.value)}
                />
              )}
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="border-t border-border px-5 py-4">
          <Button
            className={cn("w-full", media && !submitting && "gradient-brand border-0 text-primary-foreground shadow-glow")}
            disabled={!media || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Posting…" : "Share to story"}
          </Button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFile}
        />
      </SheetContent>
    </Sheet>
  );
}
