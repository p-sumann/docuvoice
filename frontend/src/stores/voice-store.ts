import { create } from "zustand";

import type { OrbState, ConnectPhase } from "@/types/voice";
import type { TranscriptEntry } from "@/types/workspace";

interface VoiceStore {
  orbState: OrbState;
  connectPhase: ConnectPhase;
  isConnected: boolean;
  sessionDuration: number;
  currentToolCall: string | null;
  errorMessage: string | null;
  transcript: TranscriptEntry[];
  isPhoneCallActive: boolean;
  phoneCallerInfo: string | null;
  /** Real-time audio level from local mic (0–1) */
  audioLevel: number;

  setOrbState: (state: OrbState) => void;
  setConnectPhase: (phase: ConnectPhase) => void;
  setConnected: (connected: boolean) => void;
  setSessionDuration: (duration: number) => void;
  setCurrentToolCall: (tool: string | null) => void;
  setError: (message: string | null) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  clearTranscript: () => void;
  setPhoneCallActive: (active: boolean, callerInfo?: string) => void;
  setAudioLevel: (level: number) => void;
  resetSession: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  orbState: "idle",
  connectPhase: null,
  isConnected: false,
  sessionDuration: 0,
  currentToolCall: null,
  errorMessage: null,
  transcript: [],
  isPhoneCallActive: false,
  phoneCallerInfo: null,
  audioLevel: 0,

  setOrbState: (orbState) => set({ orbState }),
  setConnectPhase: (connectPhase) => set({ connectPhase }),
  setConnected: (isConnected) => set({ isConnected }),
  setSessionDuration: (sessionDuration) => set({ sessionDuration }),
  setCurrentToolCall: (currentToolCall) => set({ currentToolCall }),
  setError: (errorMessage) =>
    set({ errorMessage, orbState: errorMessage ? "error" : "idle" }),
  addTranscriptEntry: (entry) =>
    set((state) => ({ transcript: [...state.transcript, entry] })),
  clearTranscript: () => set({ transcript: [] }),
  setPhoneCallActive: (isPhoneCallActive, callerInfo) =>
    set({
      isPhoneCallActive,
      phoneCallerInfo: callerInfo ?? null,
    }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  resetSession: () =>
    set({
      orbState: "idle",
      connectPhase: null,
      isConnected: false,
      sessionDuration: 0,
      currentToolCall: null,
      errorMessage: null,
      transcript: [],
      isPhoneCallActive: false,
      phoneCallerInfo: null,
      audioLevel: 0,
    }),
}));
