export type OrbState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "thinking"
  | "tool_call"
  | "error";

export interface VoiceSessionState {
  orbState: OrbState;
  isConnected: boolean;
  sessionDuration: number;
  currentToolCall: string | null;
  errorMessage: string | null;
}

export interface SuggestedQuestion {
  id: string;
  text: string;
  category: "analysis" | "comparison" | "summary" | "general";
}
