"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  FileText,
  Loader2,
  ScanSearch,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { fetchPreparationStatus, prepareWorkspace } from "@/lib/api";
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura";

const STEPS = [
  {
    key: "extracting_text",
    label: "Reading",
    description: "Extracting text from documents",
    icon: ScanSearch,
  },
  {
    key: "validating_documents",
    label: "Validating",
    description: "Checking document relevance",
    icon: ShieldCheck,
  },
  {
    key: "extracting_fields",
    label: "Extracting",
    description: "Pulling key data points",
    icon: BrainCircuit,
  },
  {
    key: "generating_findings",
    label: "Analyzing",
    description: "Scanning for discrepancies",
    icon: Sparkles,
  },
  {
    key: "finalizing",
    label: "Finalizing",
    description: "Setting up workspace",
    icon: Settings,
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
  const [currentStep, setCurrentStep] = useState("extracting_text");
  const [stepProgress, setStepProgress] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const preparedRef = useRef(false);

  const isAllRejected = currentStep === "all_rejected";
  const isComplete = currentStep === "complete";

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  useEffect(() => {
    if (!preparedRef.current) {
      preparedRef.current = true;
      prepareWorkspace(workspaceId).catch(() => {});
    }

    const interval = setInterval(async () => {
      try {
        const status = await fetchPreparationStatus(workspaceId);
        setCurrentStep(status.step);
        setStepProgress(status.progress);
        if (status.rejectedCount !== undefined) {
          setRejectedCount(status.rejectedCount);
        }

        if (status.step === "complete") {
          clearInterval(interval);
          // Invalidate workspace cache so the parent re-fetches with status="ready"
          const { setWorkspaceData } = await import("@/stores/workspace-store").then(m => m.useWorkspaceStore.getState());
          // Force a refetch by resetting the timestamps
          setWorkspaceData({
            workspace: null,
            documents: [],
            findings: [],
            extractedFields: [],
          });
        }

        if (status.step === "all_rejected") {
          clearInterval(interval);
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [workspaceId, router]);

  // All documents rejected — error state
  if (isAllRejected) {
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
        <div className="size-20 rounded-full bg-red-500/15 flex items-center justify-center">
          <AlertTriangle className="size-9 text-red-500" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-[var(--dv-text-primary)]">
            Documents Rejected
          </h2>
          <p className="text-sm text-[var(--dv-text-muted)] max-w-sm">
            {rejectedCount > 1
              ? `All ${rejectedCount} uploaded documents`
              : "The uploaded document"}{" "}
            couldn&apos;t be processed. Please try uploading different
            documents.
          </p>
        </div>

        <div className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="size-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">
            {rejectedCount} document{rejectedCount > 1 ? "s" : ""} rejected
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--dv-wine)] text-white hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="size-4" />
          Go Back &amp; Re-upload
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
      {/* Aura visualizer — centerpiece */}
      <AgentAudioVisualizerAura
        size="md"
        state={isComplete ? "listening" : "thinking"}
      />

      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-[var(--dv-text-primary)]">
          {isComplete ? "Workspace Ready" : "Setting up your workspace"}
        </h2>
        <p className="text-sm text-[var(--dv-text-muted)]">
          {isComplete
            ? `${workspaceName} is ready to go`
            : `AI is preparing ${workspaceName}`}
        </p>
      </div>

      {/* Step circles */}
      <div className="w-full flex items-center justify-between px-2">
        {STEPS.map((step, i) => {
          const isActive = i === stepIndex;
          const isDone = isComplete || i < stepIndex;
          const isPending = !isComplete && i > stepIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5 relative">
                <div
                  className={cn(
                    "size-10 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                    isDone && "bg-[var(--dv-green)]/15 border-[var(--dv-green)] text-[var(--dv-green)]",
                    isActive && "border-[var(--dv-wine)] text-[var(--dv-wine)] bg-[var(--dv-wine)]/10",
                    isPending && "border-[var(--dv-border-subtle)] text-[var(--dv-text-muted)] bg-[var(--dv-bg-surface)]",
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-5" />
                  ) : isActive ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <StepIcon className="size-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium whitespace-nowrap transition-colors duration-300",
                    isDone && "text-[var(--dv-green)]",
                    isActive && "text-[var(--dv-wine)]",
                    isPending && "text-[var(--dv-text-muted)]",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1.5 mt-[-18px] rounded-full overflow-hidden bg-[var(--dv-border-subtle)]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      i < stepIndex
                        ? "w-full bg-[var(--dv-green)]"
                        : i === stepIndex
                          ? "bg-[var(--dv-wine)]"
                          : "w-0",
                    )}
                    style={
                      i === stepIndex
                        ? { width: `${stepProgress}%` }
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current step description */}
      {!isComplete && stepIndex >= 0 && (
        <p className="text-sm text-[var(--dv-text-secondary)] animate-in fade-in duration-300">
          {STEPS[stepIndex].description}...
        </p>
      )}

      {/* Partial rejection warning */}
      {rejectedCount > 0 && !isAllRejected && (
        <div className="w-full flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <XCircle className="size-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {rejectedCount} document{rejectedCount > 1 ? "s" : ""} rejected
            — not relevant to detected domain
          </p>
        </div>
      )}
    </div>
  );
}
