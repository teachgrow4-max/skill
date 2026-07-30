"use client";

import * as React from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@skilltego/ui";
import { cn } from "@skilltego/utils";
import { uploadVoiceNote } from "@/lib/supabase-storage";

interface VoiceRecorderButtonProps {
  onRecorded: (attachment: { url: string; type: "audio"; publicId?: string }) => void;
}

export function VoiceRecorderButton({ onRecorded }: VoiceRecorderButtonProps) {
  const [recording, setRecording] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });

        setUploading(true);
        try {
          const result = await uploadVoiceNote(file);
          onRecorded({ url: result.url, type: "audio", publicId: result.path });
        } catch (uploadError) {
          setError(uploadError instanceof Error ? uploadError.message : "Could not send voice note.");
        } finally {
          setUploading(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Couldn't access your microphone.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant={recording ? "destructive" : "outline"}
        onClick={recording ? stopRecording : startRecording}
        disabled={uploading}
        aria-label={recording ? "Stop recording" : "Record a voice note"}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : recording ? (
          <Square className="size-3.5" />
        ) : (
          <Mic className="size-4" />
        )}
      </Button>
      {recording && <span className={cn("size-2 animate-pulse rounded-full bg-destructive")} />}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
