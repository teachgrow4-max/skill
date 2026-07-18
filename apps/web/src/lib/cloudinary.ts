import { publicEnv } from "@/lib/env.public";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  resourceType: "image" | "video" | "raw";
  format: string;
}

export class CloudinaryNotConfiguredError extends Error {
  constructor() {
    super(
      "Media upload isn't configured yet. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to enable it.",
    );
    this.name = "CloudinaryNotConfiguredError";
  }
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    publicEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && publicEnv.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  );
}

/**
 * Uploads a file to Cloudinary using an unsigned upload preset (client-side,
 * no server round-trip or secret key required). Configure the preset in
 * Cloudinary Console > Settings > Upload as "unsigned".
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const cloudName = publicEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = publicEnv.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new CloudinaryNotConfiguredError();
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Upload failed with status ${response.status}`);
  }

  const data = await response.json();

  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    width: data.width as number | undefined,
    height: data.height as number | undefined,
    resourceType: data.resource_type as "image" | "video" | "raw",
    format: data.format as string,
  };
}

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const ACCEPTED_PDF_TYPES = ["application/pdf"];
