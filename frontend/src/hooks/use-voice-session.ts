"use client";

import { useCallback, useEffect, useRef } from "react";

import { useVoiceStore } from "@/stores/voice-store";
import { useLiveKitSession } from "@/hooks/use-livekit-session";

interface UseVoiceSessionOptions {
  workspaceId?: string;
  workspaceName?: string;
  domain?: string;
}

export function useVoiceSession(options: UseVoiceSessionOptions = {}) {
  const store = useVoiceStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const livekit = useLiveKitSession({
    workspaceId: options.workspaceId || "",
    workspaceName: options.workspaceName,
    domain: options.domain,
  });

  // Duration timer
  useEffect(() => {
    if (livekit.isConnected) {
      timerRef.current = setInterval(() => {
        store.setSessionDuration(store.sessionDuration + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [livekit.isConnected, store.sessionDuration, store.setSessionDuration]);

  const connect = useCallback(() => {
    livekit.connect();
  }, [livekit]);

  const disconnect = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    livekit.disconnect();
  }, [livekit]);

  const toggle = useCallback(() => {
    if (livekit.isConnected) {
      disconnect();
    } else {
      connect();
    }
  }, [livekit.isConnected, connect, disconnect]);

  return {
    orbState: store.orbState,
    connectPhase: store.connectPhase,
    isConnected: livekit.isConnected,
    sessionDuration: store.sessionDuration,
    currentToolCall: store.currentToolCall,
    errorMessage: store.errorMessage,
    transcript: store.transcript,
    isPhoneCallActive: store.isPhoneCallActive,
    phoneCallerInfo: store.phoneCallerInfo,
    audioLevel: store.audioLevel,
    connect,
    disconnect,
    toggle,
  };
}
