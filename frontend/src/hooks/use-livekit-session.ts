"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  ConnectionState,
  Track,
  TrackPublication,
  TranscriptionSegment,
  RemoteParticipant,
  RemoteTrack,
  Participant,
} from "livekit-client";

import { useVoiceStore } from "@/stores/voice-store";
import type { OrbState } from "@/types/voice";
import type { TranscriptEntry } from "@/types/workspace";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LiveKitSessionOptions {
  workspaceId: string;
  workspaceName?: string;
  domain?: string;
  participantName?: string;
}

interface LiveKitSessionReturn {
  connect: () => Promise<void>;
  disconnect: () => void;
  toggle: () => void;
  isConnected: boolean;
  room: Room | null;
}

/** Map LiveKit agent states to our OrbState */
function mapAgentState(state: string): OrbState {
  switch (state) {
    case "initializing":
      return "connecting";
    case "listening":
      return "listening";
    case "thinking":
      return "thinking";
    case "speaking":
      return "speaking";
    default:
      return "listening";
  }
}

export function useLiveKitSession(
  options: LiveKitSessionOptions
): LiveKitSessionReturn {
  const store = useVoiceStore();
  const roomRef = useRef<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const transcriptCountRef = useRef(0);
  const audioLevelRafRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioLevelRafRef.current) {
        cancelAnimationFrame(audioLevelRafRef.current);
        audioLevelRafRef.current = null;
      }
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []);

  const connect = useCallback(async () => {
    store.setOrbState("connecting");
    store.setConnectPhase("requesting");
    store.setError(null);
    store.clearTranscript();
    transcriptCountRef.current = 0;

    // Abort controller for timeout (15s total)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      // 1. Kick off mic permission early (in parallel with token fetch)
      //    This is the biggest latency win — getUserMedia can take 0-3s on first visit
      const micPromise = navigator.mediaDevices
        .getUserMedia({ audio: true })
        .catch(() => null); // Don't fail the whole flow if mic is denied early

      // 2. Get token from backend
      store.setConnectPhase("requesting");
      const resp = await fetch(`${API_URL}/api/v1/livekit/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          workspaceId: options.workspaceId,
          participantName: options.participantName || "user",
          workspaceName: options.workspaceName || "",
          domain: options.domain || "insurance_claims",
        }),
      });

      if (!resp.ok) {
        throw new Error(`Token request failed: ${resp.status}`);
      }

      const data = await resp.json();
      const { token, serverUrl } = data.data;

      const livekitUrl =
        serverUrl ||
        process.env.NEXT_PUBLIC_LIVEKIT_URL ||
        "wss://placeholder.livekit.cloud";

      // 3. Create and configure room
      const room = new Room();
      roomRef.current = room;

      // 4. Subscribe to room events
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Connected) {
          setIsConnected(true);
          store.setConnected(true);
          store.setOrbState("listening");
          store.setConnectPhase(null);
        } else if (state === ConnectionState.Disconnected) {
          setIsConnected(false);
          store.resetSession();
        }
      });

      // Track agent state via participant attributes
      room.on(
        RoomEvent.ParticipantAttributesChanged,
        (
          changedAttributes: Record<string, string>,
          participant: Participant
        ) => {
          if (participant instanceof RemoteParticipant) {
            // Check for agent state
            const agentState =
              changedAttributes["lk.agent.state"] ||
              participant.attributes["lk.agent.state"];
            if (agentState) {
              const orbState = mapAgentState(agentState);
              store.setOrbState(orbState);
            }

            // Check for tool call
            const toolCall = changedAttributes["tool_call"];
            if (toolCall !== undefined) {
              if (toolCall) {
                store.setCurrentToolCall(toolCall);
                store.setOrbState("tool_call");
              } else {
                store.setCurrentToolCall(null);
              }
            }
          }
        }
      );

      // Subscribe to transcription events
      const connectTime = Date.now();
      room.on(
        RoomEvent.TranscriptionReceived,
        (
          segments: TranscriptionSegment[],
          participant?: Participant,
          _publication?: TrackPublication
        ) => {
          for (const segment of segments) {
            if (!segment.final) continue; // Only process final transcriptions

            const isAgent = participant instanceof RemoteParticipant;
            const entry: TranscriptEntry = {
              id: `t-${Date.now()}-${transcriptCountRef.current++}`,
              role: isAgent ? "agent" : "user",
              text: segment.text,
              timestamp: Math.floor((Date.now() - connectTime) / 1000),
              documentRef: null,
              toolCall: null,
            };
            store.addTranscriptEntry(entry);
          }
        }
      );

      // Handle audio tracks for playback
      room.on(
        RoomEvent.TrackSubscribed,
        (
          track: RemoteTrack,
          _publication: unknown,
          _participant: RemoteParticipant
        ) => {
          if (track.kind === Track.Kind.Audio) {
            // Audio will be played automatically by attaching to an element
            const audioEl = document.createElement("audio");
            audioEl.autoplay = true;
            track.attach(audioEl);
          }
        }
      );

      room.on(
        RoomEvent.TrackUnsubscribed,
        (track: RemoteTrack) => {
          track.detach();
        }
      );

      // 5. Connect to room + wait for mic permission in parallel
      store.setConnectPhase("connecting");
      const [, micStream] = await Promise.all([
        room.connect(livekitUrl, token),
        micPromise,
      ]);

      // Release the early mic stream — LiveKit will request its own
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
      }

      // 6. Enable microphone — permission is already granted so this is near-instant
      await room.localParticipant.setMicrophoneEnabled(true);

      // 7. Start polling audio level from local mic (~30fps)
      let lastLevel = 0;
      const pollAudio = () => {
        if (!roomRef.current) return;
        const raw = roomRef.current.localParticipant?.audioLevel ?? 0;
        // Smooth with exponential decay to avoid jitter
        const smoothed = lastLevel * 0.6 + raw * 0.4;
        lastLevel = smoothed;
        store.setAudioLevel(smoothed);
        audioLevelRafRef.current = requestAnimationFrame(pollAudio);
      };
      audioLevelRafRef.current = requestAnimationFrame(pollAudio);
    } catch (error) {
      if (controller.signal.aborted) {
        store.setError("Connection timed out. Please try again.");
      } else {
        const message =
          error instanceof Error ? error.message : "Connection failed";
        store.setError(message);
      }
      store.setOrbState("error");
      store.setConnectPhase(null);
      setIsConnected(false);
    } finally {
      clearTimeout(timeout);
    }
  }, [options, store]);

  const disconnect = useCallback(() => {
    if (audioLevelRafRef.current) {
      cancelAnimationFrame(audioLevelRafRef.current);
      audioLevelRafRef.current = null;
    }
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setIsConnected(false);
    store.resetSession();
  }, [store]);

  const toggle = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  }, [isConnected, connect, disconnect]);

  return {
    connect,
    disconnect,
    toggle,
    isConnected,
    room: roomRef.current,
  };
}
