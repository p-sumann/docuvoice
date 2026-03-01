"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Brain,
  CheckCircle2,
  AudioWaveform,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { fetchPreparationStatus, prepareWorkspace } from "@/lib/api";

interface PreparationStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const PREPARATION_STEPS: PreparationStep[] = [
  {
    id: "processing_documents",
    label: "Processing Documents",
    description: "Parsing and extracting text from uploaded files...",
    icon: FileText,
  },
  {
    id: "extracting_fields",
    label: "Extracting Fields",
    description: "AI is identifying key data points and entities...",
    icon: Search,
  },
  {
    id: "generating_findings",
    label: "Generating Findings",
    description: "Analyzing documents for discrepancies and red flags...",
    icon: Sparkles,
  },
  {
    id: "finalizing",
    label: "Finalizing",
    description: "Setting up workspace for voice analysis...",
    icon: CheckCircle2,
  },
];

interface WorkspacePreparingProps {
  workspaceId: string;
  workspaceName: string;
}

export function WorkspacePreparing({
  workspaceId,
  workspaceName,
}: WorkspacePreparingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState("processing_documents");
  const [stepProgress, setStepProgress] = useState(0);
  const preparedRef = useRef(false);

  // Kick off preparation (once) + start polling
  useEffect(() => {
    // Guard the POST so strict-mode remount doesn't re-trigger the pipeline
    if (!preparedRef.current) {
      preparedRef.current = true;
      prepareWorkspace(workspaceId).catch(() => {});
    }

    // Polling must always start — cleanup kills it on unmount,
    // and strict-mode remount creates a fresh interval.
    const interval = setInterval(async () => {
      try {
        const status = await fetchPreparationStatus(workspaceId);
        setCurrentStep(status.step);
        setStepProgress(status.progress);

        if (status.step === "complete") {
          clearInterval(interval);
          // Short delay so user sees the completion state
          setTimeout(() => {
            router.push(`/workspace/${workspaceId}`);
          }, 800);
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 600);

    return () => clearInterval(interval);
  }, [workspaceId, router]);

  const currentStepIndex = PREPARATION_STEPS.findIndex(
    (s) => s.id === currentStep
  );
  const isComplete = currentStep === "complete";

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
      {/* Animated orb */}
      <div className="relative flex items-center justify-center">
        <div className="size-20 rounded-full bg-[var(--dv-wine)] flex items-center justify-center animate-pulse">
          <AudioWaveform className="size-9 text-white" />
        </div>
        {/* Spinning ring */}
        {!isComplete && (
          <div className="absolute inset-[-8px] rounded-full border-2 border-transparent border-t-[var(--dv-wine)] animate-spin" />
        )}
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-[var(--dv-text-primary)]">
          {isComplete ? "Workspace Ready" : "Setting up your workspace"}
        </h2>
        <p className="text-sm text-[var(--dv-text-muted)]">
          {isComplete
            ? `${workspaceName} is ready to go`
            : `AI is preparing ${workspaceName} for analysis`}
        </p>
      </div>

      {/* Steps */}
      <div className="w-full space-y-3">
        {PREPARATION_STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isDone =
            isComplete || (currentStepIndex >= 0 && index < currentStepIndex);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg transition-all duration-300",
                isActive && "bg-[var(--dv-bg-surface)] border border-[var(--dv-wine)]/30",
                isDone && "opacity-70",
                !isActive && !isDone && "opacity-30"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex items-center justify-center size-9 rounded-full flex-shrink-0 transition-colors",
                  isDone && "bg-[var(--dv-green)]/15 text-[var(--dv-green)]",
                  isActive && "bg-[var(--dv-wine)]/15 text-[var(--dv-wine)]",
                  !isActive && !isDone && "bg-[var(--dv-bg-active)] text-[var(--dv-text-muted)]"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>

              {/* Text + progress */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isActive
                      ? "text-[var(--dv-text-primary)]"
                      : "text-[var(--dv-text-secondary)]"
                  )}
                >
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-[var(--dv-text-muted)] mt-0.5">
                    {step.description}
                  </p>
                )}

                {/* Progress bar */}
                {isActive && (
                  <div className="mt-2 h-1 rounded-full bg-[var(--dv-bg-active)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--dv-wine)] transition-all duration-300 ease-out"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
