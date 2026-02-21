"use client";

import { useVoiceSession } from "@/hooks/use-voice-session";
import { VoiceOrb } from "@/components/voice/voice-orb";
import { cn } from "@/lib/utils";

interface VoiceSessionControllerProps {
  className?: string;
}

export function VoiceSessionController({
  className,
}: VoiceSessionControllerProps) {
  const { orbState, currentToolCall, errorMessage, toggle } =
    useVoiceSession();

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
        onToggle={toggle}
      />
    </div>
  );
}
