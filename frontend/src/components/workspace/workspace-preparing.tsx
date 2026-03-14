"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { fetchPreparationStatus, prepareWorkspace } from "@/lib/api";
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura";

const STEP_LABELS: Record<string, string> = {
  extracting_text: "Reading documents...",
  validating_documents: "Validating relevance...",
  extracting_fields: "Extracting key data points...",
  generating_findings: "Analyzing for discrepancies...",
  finalizing: "Setting up workspace...",
  complete: "Workspace ready!",
};

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
  const [processedDocs, setProcessedDocs] = useState<string[]>([]);
  const preparedRef = useRef(false);

  const isAllRejected = currentStep === "all_rejected";
  const isComplete = currentStep === "complete";

  // Overall progress across all steps
  const stepOrder = [
    "extracting_text",
    "validating_documents",
    "extracting_fields",
    "generating_findings",
    "finalizing",
  ];
  const stepIndex = stepOrder.indexOf(currentStep);
  const overallProgress = isComplete
    ? 100
    : stepIndex >= 0
      ? ((stepIndex + stepProgress / 100) / stepOrder.length) * 100
      : 0;

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
          setTimeout(() => {
            router.push(`/workspace/${workspaceId}`);
          }, 800);
        }

        if (status.step === "all_rejected") {
          clearInterval(interval);
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 600);

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

      {/* Title + step label */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-[var(--dv-text-primary)]">
          {isComplete ? "Workspace Ready" : "Setting up your workspace"}
        </h2>
        <p className="text-sm text-[var(--dv-text-muted)]">
          {isComplete
            ? `${workspaceName} is ready to go`
            : (STEP_LABELS[currentStep] ??
              `AI is preparing ${workspaceName}`)}
        </p>
      </div>

      {/* Single progress bar */}
      <div className="w-full space-y-2">
        <div className="h-1.5 rounded-full bg-[var(--dv-bg-active)] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              isComplete
                ? "bg-[var(--dv-green)]"
                : "bg-[var(--dv-wine)]"
            )}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[var(--dv-text-muted)]">
          <span>
            {stepIndex >= 0
              ? `Step ${stepIndex + 1} of ${stepOrder.length}`
              : ""}
          </span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
      </div>

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

      {/* Document names appearing as agent "reads" them */}
      {processedDocs.length > 0 && (
        <div className="w-full space-y-2">
          {processedDocs.map((doc, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg bg-[var(--dv-bg-surface)] border border-[var(--dv-border-subtle)] animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <FileText className="size-3.5 text-[var(--dv-wine)]" />
              <span className="text-xs text-[var(--dv-text-secondary)] truncate">
                {doc}
              </span>
              <CheckCircle2 className="size-3.5 text-[var(--dv-green)] ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
