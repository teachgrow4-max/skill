import { createClient } from "@/lib/supabase/browser";

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

// Legacy bucket, kept only for resumes and DM voice notes — everything else
// moved to a dedicated bucket per content type (see migration 0022) so each
// can carry its own size limit instead of one uniform cap for everything.
const LEGACY_BUCKET = "post-media";

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
 * Uploads a file to `bucket` under the signed-in user's own folder (required
 * by every media bucket's owner-scoped RLS policy — see migration 0022).
 */
async function uploadToStorage(
  file: File,
  bucket: string,
  maxBytes: number,
): Promise<{ url: string; path: string }> {
  if (file.size > maxBytes) {
    throw new Error(`File is larger than ${Math.round(maxBytes / (1024 * 1024))}MB.`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be signed in to upload files.");
  }

  const path = `${user.id}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { url: publicUrl, path };
}

/** Posts (and reels, which are just video posts) route to a dedicated bucket by media type. */
export async function uploadPostMedia(file: File): Promise<StorageUploadResult> {
  const type = resolveMediaType(file.type);
  const { url, path } =
    type === "video"
      ? await uploadToStorage(file, "reels", MAX_VIDEO_UPLOAD_SIZE_BYTES)
      : await uploadToStorage(file, "posts", MAX_UPLOAD_SIZE_BYTES);
  return { url, path, type };
}

export async function uploadStoryMedia(file: File): Promise<StorageUploadResult> {
  const type = resolveMediaType(file.type);
  const maxBytes = type === "video" ? MAX_VIDEO_UPLOAD_SIZE_BYTES : MAX_UPLOAD_SIZE_BYTES;
  const { url, path } = await uploadToStorage(file, "stories", maxBytes);
  return { url, path, type };
}

export async function uploadProfileImage(file: File): Promise<StorageUploadResult> {
  const { url, path } = await uploadToStorage(file, "avatars", MAX_UPLOAD_SIZE_BYTES);
  return { url, path, type: resolveMediaType(file.type) };
}

export async function uploadResumeFile(file: File): Promise<StorageUploadResult> {
  const { url, path } = await uploadToStorage(file, LEGACY_BUCKET, MAX_UPLOAD_SIZE_BYTES);
  return { url, path, type: resolveMediaType(file.type) };
}

export async function uploadVoiceNote(file: File): Promise<VoiceNoteUploadResult> {
  const { url, path } = await uploadToStorage(file, LEGACY_BUCKET, MAX_UPLOAD_SIZE_BYTES);
  return { url, path, type: "audio" };
}
