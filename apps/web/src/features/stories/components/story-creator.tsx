"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { Button, Input, Textarea } from "@skilltego/ui";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import { createStoryAction } from "../actions";
import type { CreateStoryInput } from "../schema";

type StickerChoice = CreateStoryInput["stickerType"];

const STICKERS: { value: StickerChoice; label: string }[] = [
  { value: "none", label: "None" },
  { value: "poll", label: "Poll" },
  { value: "question", label: "Question" },
  { value: "quiz", label: "Quiz" },
  { value: "emoji_slider", label: "Emoji slider" },
];

export function StoryCreator({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [uploading, setUploading] = React.useState(false);
  const [media, setMedia] = React.useState<{ url: string; type: "image" | "video" } | null>(null);
  const [caption, setCaption] = React.useState("");
  const [sticker, setSticker] = React.useState<StickerChoice>("none");
  const [pollQuestion, setPollQuestion] = React.useState("");
  const [pollOptions, setPollOptions] = React.useState(["Yes", "No"]);
  const [questionPrompt, setQuestionPrompt] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isCloudinaryConfigured()) {
      setError("Media upload isn't configured yet — add Cloudinary credentials to .env.local.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const result = await uploadToCloudinary(file);
      setMedia({ url: result.url, type: result.resourceType === "video" ? "video" : "image" });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="glass w-full max-w-sm rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Create story</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {!media ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:bg-accent/40"
          >
            {uploading ? <Loader2 className="size-6 animate-spin" /> : <span>Upload photo or video</span>}
          </button>
        ) : (
          <div className="relative h-56 w-full overflow-hidden rounded-xl bg-muted">
            {media.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <video src={media.url} className="h-full w-full object-cover" muted autoPlay loop />
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFile}
        />

        <Textarea
          placeholder="Add a caption (optional)"
          rows={2}
          className="mt-3"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {STICKERS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSticker(s.value)}
              className={
                sticker === s.value
                  ? "gradient-brand rounded-full px-3 py-1 text-xs text-white"
                  : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {(sticker === "poll" || sticker === "quiz") && (
          <div className="mt-2 grid gap-2">
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
            className="mt-2"
            placeholder="Ask me anything…"
            value={questionPrompt}
            onChange={(e) => setQuestionPrompt(e.target.value)}
          />
        )}

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <Button className="mt-4 w-full" disabled={!media || submitting} onClick={handleSubmit}>
          {submitting ? "Posting…" : "Share to story"}
        </Button>
      </div>
    </div>
  );
}
