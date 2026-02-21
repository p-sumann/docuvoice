"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  Shield,
  Eye,
  HelpCircle,
  Info,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSeverityBadgeVariant } from "@/lib/utils";
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

const severityBorderWidth: Record<string, string> = {
  critical: "border-l-4",
  high: "border-l-2",
  medium: "border-l-2",
  low: "border-l-2",
  info: "border-l-2",
};

const severityBorderColor: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-red-400",
  medium: "border-l-amber-500",
  low: "border-l-blue-400",
  info: "border-l-cyan-400",
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
    <Card
      className={cn(
        "finding-enter bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]",
        "hover:bg-[var(--dv-bg-hover)] transition-all duration-150 cursor-pointer",
        severityBorderWidth[finding.severity],
        severityBorderColor[finding.severity],
        className
      )}
      onClick={handleToggle}
    >
      <CardContent className="p-3">
        {/* Header row */}
        <div className="flex items-start gap-2">
          <TypeIcon className="size-4 mt-0.5 flex-shrink-0 text-[var(--dv-text-secondary)]" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge
                variant={getSeverityBadgeVariant(finding.severity)}
                className="text-[10px] h-4 px-1.5"
              >
                {finding.severity}
              </Badge>
              <span className="text-sm font-medium text-[var(--dv-text-primary)] truncate">
                {finding.title}
              </span>
            </div>

            {/* Collapsed description */}
            {!isExpanded && (
              <p className="mt-1 text-xs text-[var(--dv-text-muted)] line-clamp-1">
                {finding.description}
              </p>
            )}
          </div>

          {/* Expand indicator */}
          {isExpanded ? (
            <ChevronDown className="size-4 text-[var(--dv-text-muted)] flex-shrink-0" />
          ) : (
            <ChevronRight className="size-4 text-[var(--dv-text-muted)] flex-shrink-0" />
          )}
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-3 pl-6 space-y-3 fade-in">
            {/* Full description */}
            <p className="text-xs text-[var(--dv-text-secondary)] leading-relaxed">
              {finding.description}
            </p>

            {/* Document references */}
            {finding.documentRefs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {finding.documentRefs.map((ref) => (
                  <span
                    key={ref}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[var(--dv-bg-active)] text-[var(--dv-cyan)]"
                  >
                    <FileText className="size-2.5" />
                    {ref}
                  </span>
                ))}
              </div>
            )}

            {/* Confidence */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--dv-text-muted)]">
                Confidence:
              </span>
              <span className="text-[10px] font-mono text-[var(--dv-text-secondary)]">
                {Math.round(finding.confidence * 100)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
