"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@skilltego/utils";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";

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

    if (!isCloudinaryConfigured()) {
      onError("Image upload isn't configured yet — add Cloudinary credentials to .env.local.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
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
          <Image src={value} alt="" fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Camera className="size-6" />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 opacity-0 transition-all duration-300 group-hover:bg-black/60 group-hover:opacity-100 group-focus-visible:opacity-100">
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-white" />
          ) : (
            <Camera className="size-5 text-white transition-transform duration-300 group-hover:scale-105" />
          )}
          <span className="px-2 text-center text-sm font-medium leading-tight text-white">
            {uploading ? "Uploading…" : `Change ${label.toLowerCase()}`}
          </span>
        </div>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
