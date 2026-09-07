import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/browser";
import { publicEnv } from "@/lib/env.public";

export interface ResumableUploadHandle {
  /** Resolves with the object's storage path once the upload finishes. */
  done: Promise<{ path: string }>;
  cancel: () => void;
}

export class UploadCancelledError extends Error {
  constructor() {
    super("Upload cancelled.");
    this.name = "UploadCancelledError";
  }
}

// Supabase's TUS endpoint requires exactly this chunk size — it's not
// configurable to something smaller/larger.
const CHUNK_SIZE = 6 * 1024 * 1024;

/**
 * Resumable upload via Supabase Storage's built-in TUS endpoint — survives a
 * dropped connection (retries the same upload session instead of restarting
 * from byte 0) and supports true mid-upload cancellation, neither of which
 * the plain storage.upload() used for images/PDFs can do. Reserved for video,
 * where a multi-MB upload over an unstable mobile connection is the actual
 * pain point; images are small enough after client-side resizing that the
 * simple path is fine.
 */
export async function uploadVideoResumable(
  file: File,
  bucket: string,
  path: string,
  onProgress?: (bytesSent: number, bytesTotal: number) => void,
): Promise<ResumableUploadHandle> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("You must be signed in to upload files.");

  let uploadRef: tus.Upload | null = null;
  let settled = false;
  let rejectRef: ((error: Error) => void) | null = null;

  const done = new Promise<{ path: string }>((resolve, reject) => {
    rejectRef = reject;
    const upload = new tus.Upload(file, {
      endpoint: `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type,
        cacheControl: "3600",
      },
      chunkSize: CHUNK_SIZE,
      onError: (error) => {
        settled = true;
        reject(error);
      },
      onProgress: (bytesSent, bytesTotal) => onProgress?.(bytesSent, bytesTotal),
      onSuccess: () => {
        settled = true;
        resolve({ path });
      },
    });

    uploadRef = upload;

    // Picks up a matching in-progress upload (e.g. the tab reloaded mid-upload)
    // instead of always starting fresh — the actual point of using TUS here.
    upload.findPreviousUploads().then((previous) => {
      if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });

  return {
    done,
    cancel: () => {
      if (settled) return;
      settled = true;
      uploadRef?.abort(true).catch(() => {});
      rejectRef?.(new UploadCancelledError());
    },
  };
}
