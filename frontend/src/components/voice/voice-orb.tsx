"use client";

import { useCallback, useMemo } from "react";
import { Mic, Wrench, X, Loader2 } from "lucide-react";

import { OrbCanvas } from "@/components/voice/orb-canvas";
import { cn } from "@/lib/utils";
import { getOrbLabel } from "@/lib/utils";
import type { OrbState, ConnectPhase } from "@/types/voice";

interface VoiceOrbProps {
  state: OrbState;
  audioLevel?: number;
  currentToolCall?: string | null;
  errorMessage?: string | null;
  connectPhase?: ConnectPhase;
  onToggle: () => void;
  disabled?: boolean;
  size?: "default" | "hero";
  className?: string;
}

function EqualizerBars({ count, intensity }: { count: number; intensity: number }) {
  return (
    <div className="flex items-center justify-center gap-[2px] h-7">
      {Array.from({ length: count }).map((_, i) => {
        const baseMax = 14 + Math.sin(i * 1.2) * 10;
        const dynamicMax = baseMax + intensity * 14;
        return (
          <span
            key={i}
            className="orb-equalizer-bar text-white/90"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${0.4 + i * 0.06 - intensity * 0.15}s`,
              ["--bar-max-height" as string]: `${dynamicMax}px`,
            }}
          />
        );
      })}
    </div>
  );
}

function ConnectingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="connecting-dot text-white/80" />
      <span className="connecting-dot text-white/80" />
      <span className="connecting-dot text-white/80" />
    </div>
  );
}

function OrbIcon({ state, audioLevel }: { state: OrbState; audioLevel: number }) {
  switch (state) {
    case "idle":
      return (
        <Mic className="size-5 text-white/70 transition-all duration-300 group-hover:scale-110 group-hover:text-white/90 drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]" />
      );
    case "connecting":
      return <ConnectingDots />;
    case "listening":
      return <EqualizerBars count={5} intensity={audioLevel} />;
    case "speaking":
      return <EqualizerBars count={7} intensity={audioLevel} />;
    case "thinking":
      return <Loader2 className="size-5 text-white/80 animate-spin" />;
    case "tool_call":
      return <Wrench className="size-4 text-white/80 animate-pulse" />;
    case "error":
      return <X className="size-5 text-white/70" />;
  }
}

/** Map voice state → shader hue rotation (degrees from base purple/cyan) */
function getOrbHue(state: OrbState): number {
  switch (state) {
    case "idle":
      return 0; // original purple/cyan
    case "connecting":
      return 60; // shift towards amber/warm
    case "listening":
      return 0;
    case "speaking":
      return 0;
    case "thinking":
      return -20; // deeper purple
    case "tool_call":
      return 60;
    case "error":
      return 120; // shift towards red
  }
}

/** Map voice state → shader hover intensity */
function getOrbIntensity(state: OrbState, audioLevel: number): number {
  switch (state) {
    case "idle":
      return 0.15;
    case "connecting":
      return 0.25;
    case "listening":
      return 0.2 + audioLevel * 0.4;
    case "speaking":
      return 0.3 + audioLevel * 0.5;
    case "thinking":
      return 0.2;
    case "tool_call":
      return 0.2;
    case "error":
      return 0.1;
  }
}

export function VoiceOrb({
  state,
  audioLevel = 0,
  currentToolCall,
  connectPhase,
  onToggle,
  disabled = false,
  size = "default",
  className,
}: VoiceOrbProps) {
  const label = getOrbLabel(state, currentToolCall, connectPhase);

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

  const isActive = state === "listening" || state === "speaking";
  const orbPx = size === "hero" ? 144 : 112;
  const level = Math.min(1, Math.max(0, audioLevel));

  const orbHue = getOrbHue(state);
  const orbIntensity = getOrbIntensity(state, level);
  const forceHover = isActive || state === "thinking";

  const dynamicVars = useMemo(
    () =>
      ({
        "--ripple-end-scale": `${2.2 + level * 1.2}`,
      }) as React.CSSProperties,
    [level]
  );

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Orb container */}
      <div
        className={cn(`orb-${state}`, "group relative flex items-center justify-center")}
        role="button"
        tabIndex={0}
        aria-label={`Voice assistant: ${label}`}
        onClick={() => !disabled && onToggle()}
        onKeyDown={handleKeyDown}
        style={{
          ...dynamicVars,
          width: `${orbPx + 32}px`,
          height: `${orbPx + 32}px`,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {/* Ripple rings — audio-reactive */}
        {isActive && (
          <>
            <div className="orb-ripple" />
            <div className="orb-ripple" />
            <div className="orb-ripple" />
          </>
        )}

        {/* Thinking orbit ring */}
        {state === "thinking" && (
          <div
            className="orb-ring absolute rounded-full border border-white/20"
            style={{ width: `${orbPx + 20}px`, height: `${orbPx + 20}px` }}
          >
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
        )}

        {/* WebGL Orb — the main sphere */}
        <div
          className={cn(
            "relative rounded-full overflow-hidden transition-transform duration-200 ease-out",
            "group-hover:scale-[1.04] group-active:scale-[0.97]",
            disabled && "opacity-50"
          )}
          style={{
            width: `${orbPx}px`,
            height: `${orbPx}px`,
            transform: isActive ? `scale(${1 + level * 0.06})` : undefined,
          }}
        >
          <OrbCanvas
            hue={orbHue}
            hoverIntensity={orbIntensity}
            rotateOnHover
            forceHoverState={forceHover}
            backgroundColor="#000000"
          />

          {/* Icon overlay — centered on top of the canvas */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <OrbIcon state={state} audioLevel={level} />
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
