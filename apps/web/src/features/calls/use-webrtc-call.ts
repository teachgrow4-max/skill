"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/browser";

type CallSignal =
  | { type: "offer"; sdp: RTCSessionDescriptionInit; from: string; video: boolean }
  | { type: "answer"; sdp: RTCSessionDescriptionInit; from: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; from: string }
  | { type: "hangup"; from: string };

/**
 * Free STUN only (no TURN) — works direct-to-direct on most home/office
 * networks, fails behind symmetric NAT/strict corporate firewalls. A paid
 * TURN relay would fix that but breaks the free-tier constraint.
 */
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];

export type CallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

export function useWebRTCCall(conversationId: string, userId: string) {
  const [status, setStatus] = React.useState<CallStatus>("idle");
  const [isVideo, setIsVideo] = React.useState(false);
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);
  const [incomingFrom, setIncomingFrom] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const channelRef = React.useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const pendingOfferRef = React.useRef<RTCSessionDescriptionInit | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);

  const cleanup = React.useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingFrom(null);
    setStatus("idle");
  }, []);

  const send = React.useCallback((signal: CallSignal) => {
    channelRef.current?.send({ type: "broadcast", event: "signal", payload: signal });
  }, []);

  const handleSignal = React.useCallback(
    (signal: CallSignal) => {
      if (signal.from === userId) return;

      if (signal.type === "offer") {
        pendingOfferRef.current = signal.sdp;
        setIsVideo(signal.video);
        setIncomingFrom(signal.from);
        setStatus("ringing");
      } else if (signal.type === "answer") {
        pcRef.current?.setRemoteDescription(signal.sdp).catch(() => {});
        setStatus("connected");
      } else if (signal.type === "ice-candidate") {
        pcRef.current?.addIceCandidate(signal.candidate).catch(() => {});
      } else if (signal.type === "hangup") {
        cleanup();
        setStatus("ended");
      }
    },
    [userId, cleanup],
  );

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`call:${conversationId}`, { config: { broadcast: { self: false } } });
    channelRef.current = channel;
    channel.on("broadcast", { event: "signal" }, ({ payload }: { payload: CallSignal }) =>
      handleSignal(payload),
    );
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, handleSignal]);

  function createPeerConnection() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (event) => {
      if (event.candidate) send({ type: "ice-candidate", candidate: event.candidate.toJSON(), from: userId });
    };
    pc.ontrack = (event) => {
      setRemoteStream((prev) => prev ?? event.streams[0]);
    };
    pcRef.current = pc;
    return pc;
  }

  async function getLocalMedia(video: boolean) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }

  async function startCall(video: boolean) {
    setError(null);
    setIsVideo(video);
    try {
      const stream = await getLocalMedia(video);
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send({ type: "offer", sdp: offer, from: userId, video });
      setStatus("calling");
    } catch {
      setError("Couldn't access your camera or microphone.");
    }
  }

  async function acceptCall() {
    if (!pendingOfferRef.current) return;
    setError(null);
    try {
      const stream = await getLocalMedia(isVideo);
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      await pc.setRemoteDescription(pendingOfferRef.current);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      send({ type: "answer", sdp: answer, from: userId });
      setStatus("connected");
    } catch {
      setError("Couldn't access your camera or microphone.");
    }
  }

  function declineCall() {
    send({ type: "hangup", from: userId });
    cleanup();
  }

  function endCall() {
    send({ type: "hangup", from: userId });
    cleanup();
  }

  function toggleMute() {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }

  function toggleCamera() {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }

  return {
    status,
    isVideo,
    localStream,
    remoteStream,
    incomingFrom,
    error,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
