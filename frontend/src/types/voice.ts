export type OrbState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "thinking"
  | "tool_call"
  | "error";

/** Sub-phase shown during the "connecting" orb state for granular feedback */
export type ConnectPhase = "requesting" | "connecting" | null;

export interface VoiceSessionState {
  orbState: OrbState;
  isConnected: boolean;
  sessionDuration: number;
  currentToolCall: string | null;
  errorMessage: string | null;
  connectPhase: ConnectPhase;
}

export interface SuggestedQuestion {
  id: string;
  text: string;
  category: "analysis" | "comparison" | "summary" | "general";
}
