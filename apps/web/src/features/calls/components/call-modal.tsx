"use client";

import * as React from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import type { AuthorSummary } from "@skilltego/types";
import type { useWebRTCCall } from "../use-webrtc-call";

interface CallModalProps {
  call: ReturnType<typeof useWebRTCCall>;
  otherUser: AuthorSummary;
}

export function CallModal({ call, otherUser }: CallModalProps) {
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteAudioRef = React.useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = React.useState(false);
  const [cameraOff, setCameraOff] = React.useState(false);

  React.useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = call.localStream;
  }, [call.localStream]);

  React.useEffect(() => {
    if (call.isVideo && remoteVideoRef.current) remoteVideoRef.current.srcObject = call.remoteStream;
    if (!call.isVideo && remoteAudioRef.current) remoteAudioRef.current.srcObject = call.remoteStream;
  }, [call.remoteStream, call.isVideo]);

  if (call.status === "idle" || call.status === "ended") return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 text-white">
      {call.isVideo ? (
        <div className="relative h-full w-full max-w-lg overflow-hidden rounded-2xl bg-black">
          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 h-32 w-24 rounded-lg border border-white/30 object-cover"
          />
        </div>
      ) : (
        <>
          <audio ref={remoteAudioRef} autoPlay />
          <Avatar className="size-28">
            <AvatarImage src={otherUser.avatarUrl ?? undefined} alt={otherUser.fullName} />
            <AvatarFallback className="text-3xl">{initials(otherUser.fullName)}</AvatarFallback>
          </Avatar>
        </>
      )}

      <div className="mt-6 text-center">
        <p className="text-lg font-semibold">{otherUser.fullName}</p>
        <p className="text-sm text-white/60">
          {call.status === "calling" && "Calling…"}
          {call.status === "ringing" && `Incoming ${call.isVideo ? "video" : "voice"} call`}
          {call.status === "connected" && "Connected"}
        </p>
        {call.error && <p className="mt-1 text-xs text-destructive">{call.error}</p>}
      </div>

      <div className="mt-8 flex items-center gap-4">
        {call.status === "ringing" ? (
          <>
            <Button
              size="icon"
              variant="destructive"
              className="size-14 rounded-full"
              onClick={call.declineCall}
              aria-label="Decline"
            >
              <PhoneOff className="size-6" />
            </Button>
            <Button
              size="icon"
              className="size-14 rounded-full bg-success text-white hover:bg-success/90"
              onClick={call.acceptCall}
              aria-label="Accept"
            >
              <Phone className="size-6" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="icon"
              variant="outline"
              className="size-12 rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"
              onClick={() => {
                call.toggleMute();
                setMuted((m) => !m);
              }}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </Button>
            {call.isVideo && (
              <Button
                size="icon"
                variant="outline"
                className="size-12 rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"
                onClick={() => {
                  call.toggleCamera();
                  setCameraOff((c) => !c);
                }}
                aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
              >
                {cameraOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
              </Button>
            )}
            <Button
              size="icon"
              variant="destructive"
              className="size-14 rounded-full"
              onClick={call.endCall}
              aria-label="End call"
            >
              <PhoneOff className="size-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
