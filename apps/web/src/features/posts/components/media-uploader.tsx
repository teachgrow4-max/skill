"use client";

import * as React from "react";
import Image from "next/image";
import { FileText, Loader2, Upload, Video, X } from "lucide-react";
import { Button } from "@skilltego/ui";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
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

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    if (!isCloudinaryConfigured()) {
      setError("Media upload isn't configured yet — add Cloudinary credentials to .env.local.");
      return;
    }

    const remaining = maxItems - value.length;
    const toUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        toUpload.map(async (file) => {
          const result = await uploadToCloudinary(file);
          const item: PostMediaItem = {
            url: result.url,
            type: result.resourceType === "raw" ? "pdf" : result.resourceType,
            width: result.width,
            height: result.height,
            publicId: result.publicId,
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
    <div className="grid gap-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((item, index) => (
            <div key={item.publicId ?? item.url} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
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

      {value.length < maxItems && (
        <Button type="button" variant="outline" size="sm" className="w-fit" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "Uploading…" : "Upload media"}
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
