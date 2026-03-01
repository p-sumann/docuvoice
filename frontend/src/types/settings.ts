export type Tonality = "professional" | "friendly" | "concise" | "detailed";

export interface ModelConfig {
  temperature: number;
  tonality: Tonality;
  systemPrompt: string;
  persona: string;
  maxTokens: number;
}
