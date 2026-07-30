"use client";

import * as React from "react";
import Image from "next/image";
import { FileText, RefreshCw, UploadCloud, Video, X } from "lucide-react";
import { cn } from "@skilltego/utils";
import { uploadPostMedia } from "@/lib/supabase-storage";
import type { PostMediaItem } from "@skilltego/types";

interface MediaUploaderProps {
  value: PostMediaItem[];
  onChange: (media: PostMediaItem[]) => void;
  maxItems?: number;
}

interface PendingUpload {
  tempId: string;
  file: File;
  previewUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploader({ value, onChange, maxItems = 10 }: MediaUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const replaceIndexRef = React.useRef<number | null>(null);
  const [pending, setPending] = React.useState<PendingUpload[]>([]);
  const [meta, setMeta] = React.useState<Record<string, { name: string; size: number }>>({});
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
    if (toUpload.length === 0) return;

    const withPreview: PendingUpload[] = toUpload.map((file) => ({
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPending((p) => [...p, ...withPreview]);

    const results = await Promise.allSettled(
      withPreview.map(async (pendingItem) => ({
        pendingItem,
        result: await uploadPostMedia(pendingItem.file),
      })),
    );

    const newItems: PostMediaItem[] = [];
    const newMeta: Record<string, { name: string; size: number }> = {};
    let firstError: string | null = null;

    for (const outcome of results) {
      if (outcome.status === "fulfilled") {
        const { pendingItem, result } = outcome.value;
        newItems.push({ url: result.url, type: result.type, publicId: result.path });
        newMeta[result.path] = { name: pendingItem.file.name, size: pendingItem.file.size };
      } else {
        firstError = outcome.reason instanceof Error ? outcome.reason.message : "Upload failed.";
      }
    }

    withPreview.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setPending((p) => p.filter((item) => !withPreview.includes(item)));
    if (newItems.length > 0) {
      setMeta((m) => ({ ...m, ...newMeta }));
      onChange([...value, ...newItems]);
    }
    if (firstError) setError(firstError);
  }

  async function handleReplace(index: number, file: File) {
    setError(null);
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const previewUrl = URL.createObjectURL(file);
    setPending((p) => [...p, { tempId, file, previewUrl }]);

    try {
      const result = await uploadPostMedia(file);
      const updated = [...value];
      updated[index] = { url: result.url, type: result.type, publicId: result.path };
      setMeta((m) => ({ ...m, [result.path]: { name: file.name, size: file.size } }));
      onChange(updated);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setPending((p) => p.filter((item) => item.tempId !== tempId));
      URL.revokeObjectURL(previewUrl);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    const replaceIndex = replaceIndexRef.current;
    replaceIndexRef.current = null;

    if (replaceIndex !== null && files && files[0]) {
      void handleReplace(replaceIndex, files[0]);
    } else {
      void handleFiles(files);
    }
    e.target.value = "";
  }

  function triggerReplace(index: number) {
    replaceIndexRef.current = index;
    inputRef.current?.click();
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const atLimit = value.length + pending.length >= maxItems;

  return (
    <div className="grid gap-3">
      {(value.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((item, index) => {
            const info = item.publicId ? meta[item.publicId] : undefined;
            return (
              <div
                key={item.publicId ?? item.url}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square bg-muted">
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
                    className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{info?.name ?? item.type}</p>
                    {info && <p className="text-[11px] text-muted-foreground">{formatBytes(info.size)}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerReplace(index)}
                    aria-label="Replace file"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {pending.map((item) => (
            <div key={item.tempId} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="relative aspect-square bg-muted">
                {item.file.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element -- transient local blob preview, next/image doesn't accept blob: URLs
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover opacity-70" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Video className="size-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-black/10">
                  <div className="gradient-brand h-full w-full animate-pulse" />
                </div>
              </div>
              <div className="px-2.5 py-2">
                <p className="truncate text-xs font-medium">{item.file.name}</p>
                <p className="text-[11px] text-muted-foreground">Uploading…</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!atLimit && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-10 text-center transition-all",
            dragActive ? "scale-[1.01] border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/30",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
            <UploadCloud className="size-6" />
          </div>
          <div className="text-sm">
            <span className="font-semibold text-foreground">Drag & drop</span>
            <span className="text-muted-foreground"> or </span>
            <span className="font-semibold text-primary">browse files</span>
          </div>
          <p className="text-xs text-muted-foreground">Images, videos, or PDFs · up to 25MB · up to {maxItems} files</p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
