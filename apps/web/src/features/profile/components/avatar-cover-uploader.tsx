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
  const inputId = React.useId();
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
      <label
        htmlFor={inputId}
        className={cn(
          "group relative block cursor-pointer overflow-hidden bg-muted",
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
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {uploading ? "Uploading…" : `Change ${label.toLowerCase()}`}
        </div>
      </label>
      <input id={inputId} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
