import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Above this, in-browser transcoding is too slow/memory-hungry to be worth attempting.
export const MAX_COMPRESSIBLE_SOURCE_BYTES = 300 * 1024 * 1024;

// Below this, a raw clip is already small enough that re-encoding it isn't
// worth the transcode time — most phone cameras shoot well above this.
export const COMPRESS_TRIGGER_BYTES = 8 * 1024 * 1024;

// Applies regardless of file size — an uncapped duration meant a long clip's
// worst-case size was unbounded no matter how aggressively it got compressed.
export const MAX_VIDEO_DURATION_SECONDS = 90;

// Output frame bounds, orientation-aware: 720p landscape is 1280x720, 720p
// portrait (every phone-shot reel/story) is 720x1280.
const MAX_LONG_SIDE = 1280;
const MAX_SHORT_SIDE = 720;

// A clip under COMPRESS_TRIGGER_BYTES can still be a few seconds of
// 4K/60fps — anything streaming above this is worth re-encoding regardless.
const COMPRESS_TRIGGER_BITRATE = 4_000_000;

// Quality-targeted encode (CRF) with a bitrate ceiling. 3.5Mbps for 90s plus
// 128kbps audio lands around 41MB, so the ceiling below only ever fires on an
// encoder overshoot.
const VIDEO_CRF = 21;
const VIDEO_MAXRATE = 3_500_000;
const HARD_OUTPUT_CEILING_BYTES = 45 * 1024 * 1024;

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL("/ffmpeg/ffmpeg-core.js", "text/javascript"),
        toBlobURL("/ffmpeg/ffmpeg-core.wasm", "application/wasm"),
      ]);
      await ffmpeg.load({ coreURL, wasmURL });
      return ffmpeg;
    })().catch((loadError) => {
      ffmpegPromise = null;
      throw loadError;
    });
  }
  return ffmpegPromise;
}

export interface VideoMetadata {
  durationSeconds: number;
  width: number;
  height: number;
}

export function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({ durationSeconds: video.duration, width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the video file."));
    };
  });
}

function exceedsOutputBounds(metadata: VideoMetadata): boolean {
  const { width, height } = metadata;
  return Math.max(width, height) > MAX_LONG_SIDE || Math.min(width, height) > MAX_SHORT_SIDE;
}

/**
 * Whether a clip should be re-encoded before upload: big files, anything
 * above 720p (even when short and small), high-bitrate clips, and non-MP4
 * containers (.mov/.webm), which don't play everywhere.
 */
export function shouldCompressVideo(file: File, metadata: VideoMetadata | null): boolean {
  if (file.size > COMPRESS_TRIGGER_BYTES) return true;
  if (file.type !== "video/mp4") return true;
  if (!metadata) return false;
  if (exceedsOutputBounds(metadata)) return true;
  const durationSeconds = metadata.durationSeconds;
  return (
    Number.isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    (file.size * 8) / durationSeconds > COMPRESS_TRIGGER_BITRATE
  );
}

function sourceExtension(name: string): string {
  const match = name.match(/\.[^./]+$/);
  return match ? match[0] : ".mp4";
}

function compressedName(name: string): string {
  return `${name.replace(/\.[^./]+$/, "")}-compressed.mp4`;
}

/**
 * Re-encodes `file` to H.264 MP4 at up to 720p (either orientation), 30fps,
 * quality-targeted (CRF) with a bitrate ceiling — simple content (screen
 * recordings, talking heads) comes out far smaller than a fixed bitrate would
 * give, and busy content keeps detail up to the cap. Runs entirely
 * client-side via ffmpeg.wasm — no server/paid API.
 */
export async function compressVideo(file: File, onProgress?: (ratio: number) => void): Promise<File> {
  const ffmpeg = await loadFFmpeg();

  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputName = `in-${jobId}${sourceExtension(file.name)}`;
  const outputName = `out-${jobId}.mp4`;

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(1, Math.max(0, progress)));
  };
  ffmpeg.on("progress", handleProgress);

  try {
    await ffmpeg.exec([
      "-i",
      inputName,
      // Downscale before encoding so there are fewer pixels to compress — the
      // biggest speed lever for phone-recorded (1080p/4K) source. The bounding
      // box follows the clip's orientation so a portrait 1080x1920 reel becomes
      // 720x1280, not a squashed 405x720. force_divisible_by=2 because libx264
      // refuses odd dimensions; lanczos keeps edges and text crisp.
      "-vf",
      `scale=w='if(gte(iw,ih),min(${MAX_LONG_SIDE},iw),min(${MAX_SHORT_SIDE},iw))':h='if(gte(iw,ih),min(${MAX_SHORT_SIDE},ih),min(${MAX_LONG_SIDE},ih))':force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos`,
      // 60fps phone clips double the encode work and bitrate for little visible gain in a feed.
      "-fpsmax",
      "30",
      "-c:v",
      "libx264",
      // superfast over ultrafast: ultrafast turns off deblocking/CABAC/B-frames,
      // which is what made output look blocky. In ffmpeg.wasm (single-threaded,
      // decode-bound) superfast measured ~15% slower than ultrafast; veryfast was
      // ~50% slower — too much added wait for a 90s clip.
      "-preset",
      "superfast",
      "-crf",
      `${VIDEO_CRF}`,
      "-maxrate",
      `${VIDEO_MAXRATE}`,
      "-bufsize",
      `${VIDEO_MAXRATE * 2}`,
      "-profile:v",
      "high",
      // 10-bit/HDR phone footage otherwise produces files some browsers can't play.
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });
    if (blob.size > HARD_OUTPUT_CEILING_BYTES) {
      throw new Error("This video is too large even after compression — try trimming it shorter.");
    }
    return new File([blob], compressedName(file.name), { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", handleProgress);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}

/**
 * Compresses `file` when shouldCompressVideo says so. Keeps the original if
 * re-encoding came out bigger and the original was already within 720p — an
 * already-efficient MP4 shouldn't get both larger and re-encoded.
 */
export async function optimizeVideoForUpload(
  file: File,
  metadata: VideoMetadata | null,
  onProgress?: (ratio: number) => void,
): Promise<File> {
  if (!shouldCompressVideo(file, metadata)) return file;
  const compressed = await compressVideo(file, onProgress);
  const originalIsPlayableAsIs =
    file.type === "video/mp4" && metadata !== null && !exceedsOutputBounds(metadata);
  if (compressed.size >= file.size && originalIsPlayableAsIs) return file;
  return compressed;
}
