"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  FileText,
  Shield,
  Eye,
  HelpCircle,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Finding } from "@/types/finding";

interface FindingCardProps {
  finding: Finding;
  isExpanded?: boolean;
  onToggle?: (finding: Finding) => void;
  className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  discrepancy: AlertTriangle,
  anomaly: Eye,
  exposure: Shield,
  missing: HelpCircle,
  red_flag: AlertTriangle,
};

const severityColors: Record<string, string> = {
  critical: "text-red-500",
  high: "text-red-400",
  medium: "text-amber-500",
  low: "text-blue-400",
  info: "text-cyan-400",
};

const severityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-red-400",
  medium: "bg-amber-500",
  low: "bg-blue-400",
  info: "bg-cyan-400",
};

export function FindingCard({
  finding,
  isExpanded: controlledExpanded,
  onToggle,
  className,
}: FindingCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;

  const TypeIcon = typeIcons[finding.type] ?? Info;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(finding);
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  return (
    <div
      className={cn(
        "finding-enter rounded-md cursor-pointer transition-colors duration-150",
        "hover:bg-[var(--dv-bg-hover)]",
        isExpanded && "bg-[var(--dv-bg-surface)]",
        className
      )}
      onClick={handleToggle}
    >
      {/* Compact row */}
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        {/* Severity dot */}
        <span
          className={cn("size-1.5 rounded-full flex-shrink-0", severityDot[finding.severity])}
        />

        {/* Type icon */}
        <TypeIcon
          className={cn("size-3 flex-shrink-0", severityColors[finding.severity])}
        />

        {/* Title */}
        <span className="flex-1 min-w-0 text-xs text-[var(--dv-text-primary)] truncate">
          {finding.title}
        </span>

        {/* Severity label */}
        <span className={cn("flex-shrink-0 text-[10px] capitalize", severityColors[finding.severity])}>
          {finding.severity}
        </span>

        {/* Expand chevron */}
        <ChevronRight
          className={cn(
            "size-3 flex-shrink-0 text-[var(--dv-text-muted)] transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
      </div>

      {/* Expandable detail — CSS grid transition for smooth height */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-2.5 pb-2.5 pt-0.5 space-y-2">
            {/* Description */}
            <p className="text-[11px] leading-relaxed text-[var(--dv-text-secondary)] pl-[22px]">
              {finding.description}
            </p>

            {/* Footer: doc refs + confidence */}
            <div className="flex items-center gap-2 pl-[22px] flex-wrap">
              {finding.documentRefs.map((ref) => (
                <span
                  key={ref}
                  className="inline-flex items-center gap-1 text-[10px] text-[var(--dv-text-muted)]"
                >
                  <FileText className="size-2.5" />
                  {ref}
                </span>
              ))}

              {finding.documentRefs.length > 0 && (
                <span className="text-[var(--dv-border-default)]">·</span>
              )}

              <span className="text-[10px] font-mono text-[var(--dv-text-muted)]">
                {Math.round(finding.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
