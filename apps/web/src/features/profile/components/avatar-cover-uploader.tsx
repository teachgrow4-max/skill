"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@skilltego/utils";
import { uploadProfileImage } from "@/lib/supabase-storage";
import { resizeImage } from "@/lib/image-resize";

const MAX_DIMENSION: Record<AvatarCoverUploaderProps["shape"], number> = {
  circle: 512,
  banner: 1200,
};

interface AvatarCoverUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onError: (message: string) => void;
  shape: "circle" | "banner";
}

export function AvatarCoverUploader({ label, value, onChange, onError, shape }: AvatarCoverUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const resized = await resizeImage(file, MAX_DIMENSION[shape]);
      const result = await uploadProfileImage(resized);
      onChange(result.url);
    } catch (uploadError) {
      onError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="grid gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={`Change ${label.toLowerCase()}`}
        className={cn(
          "group relative block cursor-pointer overflow-hidden bg-muted outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          shape === "circle" ? "size-24 rounded-full" : "aspect-[3/1] w-full rounded-lg",
        )}
      >
        {value ? (
          <Image src={value} alt="" fill quality={90} className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Camera className="size-6" />
          </div>
        )}
        {/* Full hover reveal — a nice-to-have on desktop, but hover doesn't
            exist on touch, so it can never be the ONLY way to discover this
            is editable (that was the actual mobile "can't change photo" bug:
            once a photo is set, nothing on a phone ever hinted it was
            tappable). The corner badge below is always visible instead. */}
        <div className="absolute inset-0 hidden flex-col items-center justify-center gap-1 bg-black/45 opacity-0 transition-all duration-300 group-hover:flex group-hover:bg-black/60 group-hover:opacity-100 group-focus-visible:flex group-focus-visible:opacity-100">
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-white" />
          ) : (
            <Camera className="size-5 text-white transition-transform duration-300 group-hover:scale-105" />
          )}
          <span className="px-2 text-center text-sm font-medium leading-tight text-white">
            {uploading ? "Uploading…" : `Change ${label.toLowerCase()}`}
          </span>
        </div>
        {value && (
          <div
            className={cn(
              "absolute flex items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm",
              shape === "circle" ? "bottom-0 right-0 size-8" : "bottom-2 right-2 size-9",
            )}
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
