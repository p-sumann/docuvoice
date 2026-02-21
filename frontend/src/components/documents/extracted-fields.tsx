"use client";

import { useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { ExtractedField } from "@/types/workspace";

interface ExtractedFieldsListProps {
  fields: ExtractedField[];
  className?: string;
}

const currencyFields = new Set([
  "bi_limit",
  "pd_limit",
  "deductible",
  "total_medical",
]);

function FieldRow({ field }: { field: ExtractedField }) {
  const [copied, setCopied] = useState(false);

  const displayValue = currencyFields.has(field.key)
    ? formatCurrency(field.value)
    : field.value;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(field.value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-4 py-2 group",
        "hover:bg-[var(--dv-bg-hover)] transition-colors cursor-pointer",
        field.isAnomaly && "bg-red-500/5"
      )}
      onClick={handleCopy}
    >
      {/* Key */}
      <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
        {field.isAnomaly && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="size-3 text-[var(--dv-amber)] flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-xs">
              {field.anomalyReason}
            </TooltipContent>
          </Tooltip>
        )}
        <span className="text-xs text-[var(--dv-text-secondary)] truncate">
          {field.key.replace(/_/g, " ")}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={cn(
            "text-xs font-mono text-[var(--dv-text-primary)] text-right truncate",
            field.isAnomaly && "text-[var(--dv-amber)] underline decoration-wavy decoration-[var(--dv-amber)]/40 underline-offset-2"
          )}
        >
          {displayValue}
        </span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? (
            <Check className="size-3 text-[var(--dv-green)]" />
          ) : (
            <Copy className="size-3 text-[var(--dv-text-muted)]" />
          )}
        </span>
      </div>
    </div>
  );
}

export function ExtractedFieldsList({
  fields,
  className,
}: ExtractedFieldsListProps) {
  const anomalyCount = fields.filter((f) => f.isAnomaly).length;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-xs font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider">
          Extracted Fields ({fields.length})
        </h3>
        {anomalyCount > 0 && (
          <span className="text-[10px] text-[var(--dv-amber)]">
            {anomalyCount} anomal{anomalyCount === 1 ? "y" : "ies"}
          </span>
        )}
      </div>

      {/* Fields */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[var(--dv-border-subtle)]">
          {fields.map((field, i) => (
            <FieldRow key={`${field.key}-${i}`} field={field} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
