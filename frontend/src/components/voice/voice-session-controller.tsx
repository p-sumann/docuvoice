"use client";

import { VoiceOrb } from "@/components/voice/voice-orb";
import { cn } from "@/lib/utils";
import type { OrbState, ConnectPhase } from "@/types/voice";

interface VoiceSessionControllerProps {
  orbState: OrbState;
  currentToolCall?: string | null;
  errorMessage?: string | null;
  connectPhase?: ConnectPhase;
  audioLevel?: number;
  onToggle: () => void;
  className?: string;
}

export function VoiceSessionController({
  orbState,
  currentToolCall,
  errorMessage,
  connectPhase,
  audioLevel = 0,
  onToggle,
  className,
}: VoiceSessionControllerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-8",
        className
      )}
    >
      <VoiceOrb
        state={orbState}
        currentToolCall={currentToolCall}
        errorMessage={errorMessage}
        connectPhase={connectPhase}
        audioLevel={audioLevel}
        onToggle={onToggle}
      />
    </div>
  );
}
