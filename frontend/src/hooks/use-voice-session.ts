"use client";

import { useCallback, useEffect, useRef } from "react";

import { useVoiceStore } from "@/stores/voice-store";
import { MOCK_TRANSCRIPT } from "@/lib/mock-data";
import type { OrbState } from "@/types/voice";

export function useVoiceSession() {
  const store = useVoiceStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const demoRef = useRef<NodeJS.Timeout | null>(null);

  // Duration timer
  useEffect(() => {
    if (store.isConnected) {
      timerRef.current = setInterval(() => {
        store.setSessionDuration(store.sessionDuration + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [store.isConnected, store.sessionDuration, store.setSessionDuration]);

  const connect = useCallback(() => {
    store.setOrbState("connecting");
    store.clearTranscript();

    // Simulate connection after 1.5s
    setTimeout(() => {
      store.setConnected(true);
      store.setOrbState("listening");

      // Start demo transcript playback
      let entryIndex = 0;
      const playNextEntry = () => {
        if (entryIndex >= MOCK_TRANSCRIPT.length) return;
        const entry = MOCK_TRANSCRIPT[entryIndex];
        const nextEntry = MOCK_TRANSCRIPT[entryIndex + 1];

        // Set orb state based on entry
        let orbState: OrbState = "listening";
        if (entry.role === "agent" && entry.toolCall) {
          orbState = "tool_call";
          store.setCurrentToolCall(entry.toolCall);
        } else if (entry.role === "agent") {
          orbState = "speaking";
        }

        store.setOrbState(orbState);
        store.addTranscriptEntry(entry);

        // Reset to listening after agent speaks
        if (entry.role === "agent") {
          setTimeout(() => {
            store.setOrbState("listening");
            store.setCurrentToolCall(null);
          }, 1500);
        }

        entryIndex++;
        if (nextEntry) {
          const delayMs = (nextEntry.timestamp - entry.timestamp) * 500;
          demoRef.current = setTimeout(playNextEntry, Math.max(delayMs, 800));
        }
      };

      demoRef.current = setTimeout(playNextEntry, 1000);
    }, 1500);
  }, [store]);

  const disconnect = useCallback(() => {
    if (demoRef.current) clearTimeout(demoRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    store.resetSession();
  }, [store]);

  const toggle = useCallback(() => {
    if (store.isConnected) {
      disconnect();
    } else {
      connect();
    }
  }, [store.isConnected, connect, disconnect]);

  return {
    orbState: store.orbState,
    isConnected: store.isConnected,
    sessionDuration: store.sessionDuration,
    currentToolCall: store.currentToolCall,
    errorMessage: store.errorMessage,
    transcript: store.transcript,
    isPhoneCallActive: store.isPhoneCallActive,
    phoneCallerInfo: store.phoneCallerInfo,
    connect,
    disconnect,
    toggle,
  };
}
