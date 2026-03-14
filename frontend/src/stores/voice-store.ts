import { create } from "zustand";

import type { SuggestedQuestion } from "@/types/voice";

interface VoiceStore {
  /** Session duration in seconds (managed by workspace page timer) */
  sessionDuration: number;
  /** Phone call state */
  isPhoneCallActive: boolean;
  phoneCallerInfo: string | null;
  /** Suggested questions for the current workspace */
  suggestedQuestions: SuggestedQuestion[];
  /** Connection error message */
  errorMessage: string | null;

  setSessionDuration: (duration: number) => void;
  setPhoneCallActive: (active: boolean, callerInfo?: string) => void;
  setSuggestedQuestions: (questions: SuggestedQuestion[]) => void;
  setError: (message: string | null) => void;
  resetSession: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  sessionDuration: 0,
  isPhoneCallActive: false,
  phoneCallerInfo: null,
  suggestedQuestions: [],
  errorMessage: null,

  setSessionDuration: (sessionDuration) => set({ sessionDuration }),
  setPhoneCallActive: (isPhoneCallActive, callerInfo) =>
    set({
      isPhoneCallActive,
      phoneCallerInfo: callerInfo ?? null,
    }),
  setSuggestedQuestions: (suggestedQuestions) => set({ suggestedQuestions }),
  setError: (errorMessage) => set({ errorMessage }),
  resetSession: () =>
    set({
      sessionDuration: 0,
      isPhoneCallActive: false,
      phoneCallerInfo: null,
      suggestedQuestions: [],
      errorMessage: null,
    }),
}));
