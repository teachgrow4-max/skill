/**
 * Downscales an image client-side (canvas) before upload so a raw 12MP+ phone
 * photo doesn't go to storage untouched when the UI only ever displays it at
 * a fraction of that resolution. No-ops (returns the original file) for GIFs
 * — a canvas draw only captures a single frame, which would silently kill
 * animation — and for anything already at or under `maxDimension`.
 */
export async function resizeImage(
  file: File,
  maxDimension: number,
  quality = 0.85,
): Promise<File> {
  if (file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  if (scale >= 1) {
    bitmap.close();
    return file;
  }

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // PNG keeps transparency but has no quality knob; everything else (JPEG,
  // WebP, and anything canvas doesn't recognize) re-encodes as JPEG, which is
  // both smaller and universally supported.
  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const outputExt = outputType === "image/png" ? "png" : "jpg";

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, quality));
  if (!blob) return file;

  const name = file.name.replace(/\.[^./]+$/, "") || "image";
  return new File([blob], `${name}-resized.${outputExt}`, { type: outputType });
}
