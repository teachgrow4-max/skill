import { createClient } from "@/lib/supabase/browser";

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

const BUCKET = "post-media";

export interface StorageUploadResult {
  url: string;
  path: string;
  type: "image" | "video" | "pdf";
}

export interface VoiceNoteUploadResult {
  url: string;
  path: string;
  type: "audio";
}

function resolveMediaType(mimeType: string): "image" | "video" | "pdf" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "pdf";
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5 && fromName !== file.name) return fromName.toLowerCase();
  return file.type.split("/").pop() ?? "bin";
}

/**
 * Uploads a file to the public `post-media` Supabase Storage bucket under the
 * signed-in user's own folder (required by the bucket's RLS policies). The
 * `prefix` just labels the filename (post/avatar/cover/resume/voice) — every
 * kind of upload shares the same bucket and policies.
 */
async function uploadToStorage(file: File, prefix: string): Promise<{ url: string; path: string }> {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File is larger than 25MB.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be signed in to upload files.");
  }

  const path = `${user.id}/${prefix}-${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: publicUrl, path };
}

export async function uploadPostMedia(file: File): Promise<StorageUploadResult> {
  const { url, path } = await uploadToStorage(file, "post");
  return { url, path, type: resolveMediaType(file.type) };
}

export async function uploadProfileImage(
  file: File,
  kind: "avatar" | "cover",
): Promise<StorageUploadResult> {
  const { url, path } = await uploadToStorage(file, kind);
  return { url, path, type: resolveMediaType(file.type) };
}

export async function uploadResumeFile(file: File): Promise<StorageUploadResult> {
  const { url, path } = await uploadToStorage(file, "resume");
  return { url, path, type: resolveMediaType(file.type) };
}

export async function uploadVoiceNote(file: File): Promise<VoiceNoteUploadResult> {
  const { url, path } = await uploadToStorage(file, "voice");
  return { url, path, type: "audio" };
}
