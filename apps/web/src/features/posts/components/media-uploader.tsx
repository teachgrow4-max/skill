"use client";

import * as React from "react";
import Image from "next/image";
import { FileText, Loader2, Upload, Video, X } from "lucide-react";
import { Button } from "@skilltego/ui";
import { cn } from "@skilltego/utils";
import { uploadPostMedia } from "@/lib/supabase-storage";
import type { PostMediaItem } from "@skilltego/types";

interface MediaUploaderProps {
  value: PostMediaItem[];
  onChange: (media: PostMediaItem[]) => void;
  maxItems?: number;
}

export function MediaUploader({ value, onChange, maxItems = 10 }: MediaUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = maxItems - value.length;
    const toUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        toUpload.map(async (file) => {
          const result = await uploadPostMedia(file);
          const item: PostMediaItem = {
            url: result.url,
            type: result.type,
            publicId: result.path,
          };
          return item;
        }),
      );
      onChange([...value, ...uploaded]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-3" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((item, index) => (
            <div
              key={item.publicId ?? item.url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {item.type === "image" ? (
                <Image src={item.url} alt="" fill className="object-cover" />
              ) : item.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Video className="size-8 text-muted-foreground" />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FileText className="size-8 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && value.length < maxItems && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
          )}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-6 text-muted-foreground" />
          )}
          <div className="text-sm">
            <span className="font-medium text-foreground">
              {uploading ? "Uploading…" : "Drag and drop"}
            </span>
            {!uploading && <span className="text-muted-foreground"> or click to upload images or videos</span>}
          </div>
        </button>
      )}

      {value.length > 0 && value.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "Uploading…" : "Add more"}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
