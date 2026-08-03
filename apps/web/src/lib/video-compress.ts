import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Above this, in-browser transcoding is too slow/memory-hungry to be worth attempting.
export const MAX_COMPRESSIBLE_SOURCE_BYTES = 300 * 1024 * 1024;

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

function getVideoDurationSeconds(file: File): Promise<number> {
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
 * Re-encodes `file` to fit within `maxBytes`, targeting a bitrate derived from
 * the clip's duration (with headroom for muxing overhead and single-pass ABR
 * overshoot). Runs entirely client-side via ffmpeg.wasm — no server/paid API.
 */
export async function compressVideoToLimit(
  file: File,
  maxBytes: number,
  onProgress?: (ratio: number) => void,
): Promise<File> {
  const duration = await getVideoDurationSeconds(file);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Could not read this video's length, so it can't be compressed automatically.");
  }

  const ffmpeg = await loadFFmpeg();
  const audioBitrate = 96_000;
  const targetTotalBits = maxBytes * 8 * 0.9;
  const videoBitrate = Math.max(150_000, Math.floor(targetTotalBits / duration) - audioBitrate);

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
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-b:v",
      `${videoBitrate}`,
      "-maxrate",
      `${videoBitrate}`,
      "-bufsize",
      `${videoBitrate * 2}`,
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });
    if (blob.size > maxBytes) {
      throw new Error("This video is too long to compress under 25MB — try trimming it first.");
    }
    return new File([blob], compressedName(file.name), { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", handleProgress);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
