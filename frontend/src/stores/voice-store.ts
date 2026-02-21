import { create } from "zustand";

import type { OrbState } from "@/types/voice";
import type { TranscriptEntry } from "@/types/workspace";

interface VoiceStore {
  orbState: OrbState;
  isConnected: boolean;
  sessionDuration: number;
  currentToolCall: string | null;
  errorMessage: string | null;
  transcript: TranscriptEntry[];
  isPhoneCallActive: boolean;
  phoneCallerInfo: string | null;

  setOrbState: (state: OrbState) => void;
  setConnected: (connected: boolean) => void;
  setSessionDuration: (duration: number) => void;
  setCurrentToolCall: (tool: string | null) => void;
  setError: (message: string | null) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  clearTranscript: () => void;
  setPhoneCallActive: (active: boolean, callerInfo?: string) => void;
  resetSession: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  orbState: "idle",
  isConnected: false,
  sessionDuration: 0,
  currentToolCall: null,
  errorMessage: null,
  transcript: [],
  isPhoneCallActive: false,
  phoneCallerInfo: null,

  setOrbState: (orbState) => set({ orbState }),
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
  resetSession: () =>
    set({
      orbState: "idle",
      isConnected: false,
      sessionDuration: 0,
      currentToolCall: null,
      errorMessage: null,
      transcript: [],
      isPhoneCallActive: false,
      phoneCallerInfo: null,
    }),
}));
