"use client";

import { useCallback } from "react";
import { Mic, Wrench, X, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { getOrbLabel } from "@/lib/utils";
import type { OrbState } from "@/types/voice";

interface VoiceOrbProps {
  state: OrbState;
  currentToolCall?: string | null;
  errorMessage?: string | null;
  onToggle: () => void;
  disabled?: boolean;
  size?: "default" | "hero";
  className?: string;
}

function EqualizerBars({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="orb-equalizer-bar text-white/90"
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.5 + i * 0.08}s`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ["--bar-max-height" as any]: `${20 + Math.sin(i * 1.2) * 14}px`,
          }}
        />
      ))}
    </div>
  );
}

function ConnectingDots() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="connecting-dot text-white/80" />
      <span className="connecting-dot text-white/80" />
      <span className="connecting-dot text-white/80" />
    </div>
  );
}

function OrbIcon({ state }: { state: OrbState }) {
  switch (state) {
    case "idle":
      return <Mic className="size-8 text-white/60" />;
    case "connecting":
      return <ConnectingDots />;
    case "listening":
      return <EqualizerBars count={5} />;
    case "speaking":
      return <EqualizerBars count={7} />;
    case "thinking":
      return <Loader2 className="size-8 text-white/80 animate-spin" />;
    case "tool_call":
      return <Wrench className="size-7 text-white/80" />;
    case "error":
      return <X className="size-8 text-white/70" />;
  }
}

export function VoiceOrb({
  state,
  currentToolCall,
  onToggle,
  disabled = false,
  size = "default",
  className,
}: VoiceOrbProps) {
  const label = getOrbLabel(state, currentToolCall);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!disabled) onToggle();
      }
      if (e.key === "Escape" && state !== "idle") {
        e.preventDefault();
        onToggle();
      }
    },
    [disabled, onToggle, state]
  );

  const showRipples =
    state === "listening" || state === "speaking";

  const orbSize = size === "hero" ? "w-44 h-44" : "w-36 h-36";

  return (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      {/* Orb container */}
      <div
        className={cn(`orb-${state}`, "relative")}
        role="button"
        tabIndex={0}
        aria-label={`Voice assistant: ${label}`}
        onClick={() => !disabled && onToggle()}
        onKeyDown={handleKeyDown}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {/* Ambient glow behind the orb */}
        <div
          className={cn(
            "absolute inset-[-40%] rounded-full blur-3xl transition-all duration-700",
            state === "idle" && "opacity-15 bg-[var(--dv-wine)]",
            state === "connecting" && "opacity-30 bg-[var(--dv-amber)]",
            state === "listening" && "opacity-40 bg-[var(--dv-wine)]",
            state === "speaking" && "opacity-50 bg-[var(--dv-wine)]",
            state === "thinking" && "opacity-35 bg-purple-600",
            state === "tool_call" && "opacity-35 bg-[var(--dv-amber)]",
            state === "error" && "opacity-45 bg-red-600"
          )}
        />

        {/* Ripple rings */}
        {showRipples && (
          <>
            <div className="orb-ripple" />
            <div className="orb-ripple" />
            <div className="orb-ripple" />
          </>
        )}

        {/* Thinking orbit ring */}
        {state === "thinking" && (
          <div className="orb-ring absolute inset-[-10px] rounded-full border border-[var(--dv-wine-light)]/30">
            {/* Orbiting dot */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[var(--dv-wine-bright)]" />
          </div>
        )}

        {/* Main orb sphere */}
        <div
          className={cn(
            "orb-body relative flex items-center justify-center",
            orbSize,
            "rounded-full",
            "transition-transform duration-300 ease-out",
            "hover:scale-[1.04] active:scale-[0.96]",
            "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--dv-wine)]",
            disabled && "opacity-50"
          )}
        >
          {/* Inner content */}
          <div className="relative z-10">
            <OrbIcon state={state} />
          </div>
        </div>
      </div>

      {/* Label */}
      <p
        className="text-sm text-[var(--dv-text-secondary)] text-center tracking-wide"
        aria-live="polite"
      >
        {label}
      </p>
    </div>
  );
}
