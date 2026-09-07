/**
 * Captures a poster-frame thumbnail (and the video's natural dimensions) from
 * a video file, entirely client-side via a hidden <video>+<canvas> — no
 * server-side processing needed. Used both to populate posts.thumbnail_url
 * (so the feed/grid can show something without loading the full video) and
 * as the poster attribute during playback.
 */
export interface VideoPreview {
  width: number;
  height: number;
  thumbnail: File;
}

const THUMBNAIL_JPEG_QUALITY = 0.8;

export function captureVideoPreview(file: File): Promise<VideoPreview> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    function cleanup() {
      URL.revokeObjectURL(url);
      video.remove();
    }

    video.onloadedmetadata = () => {
      // A hair past the very first frame avoids an all-black frame some encoders start on.
      video.currentTime = Math.min(0.5, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Could not generate a thumbnail for this video."));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          const { videoWidth: width, videoHeight: height } = video;
          cleanup();
          if (!blob) {
            reject(new Error("Could not generate a thumbnail for this video."));
            return;
          }
          resolve({ width, height, thumbnail: new File([blob], "thumbnail.jpg", { type: "image/jpeg" }) });
        },
        "image/jpeg",
        THUMBNAIL_JPEG_QUALITY,
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read this video file."));
    };
  });
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image file."));
    };
    img.src = url;
  });
}
