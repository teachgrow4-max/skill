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

// Sanity ceiling on the compressed output. 720p @ 2.5Mbps + 128kbps audio for
// 90s lands around 30MB, so this only ever fires on an ABR overshoot.
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

export function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the video file."));
    };
  });
}

function sourceExtension(name: string): string {
  const match = name.match(/\.[^./]+$/);
  return match ? match[0] : ".mp4";
}

function compressedName(name: string): string {
  return `${name.replace(/\.[^./]+$/, "")}-compressed.mp4`;
}

/**
 * Re-encodes `file` to a fixed 720p / 2.5Mbps target — consistent quality
 * regardless of clip length, instead of deriving bitrate from a byte budget
 * (which crushed long clips to mush and wasted headroom on short ones). Runs
 * entirely client-side via ffmpeg.wasm — no server/paid API.
 */
export async function compressVideo(file: File, onProgress?: (ratio: number) => void): Promise<File> {
  const ffmpeg = await loadFFmpeg();
  const videoBitrate = 2_500_000;

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
      // Downscale before encoding so there are fewer pixels to compress — this is
      // usually the biggest speed lever for phone-recorded (1440p/4K) source video,
      // and also gives the target bitrate a much easier job (better quality per bit).
      // 720p rather than 1080p: mobile short-form video looks essentially identical
      // on a phone screen at 720p while roughly halving the bitrate needed.
      "-vf",
      "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-b:v",
      `${videoBitrate}`,
      "-maxrate",
      `${videoBitrate}`,
      "-bufsize",
      `${videoBitrate * 2}`,
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
