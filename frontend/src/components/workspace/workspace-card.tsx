"use client";

import { ClipboardCheck, Scale, TrendingUp, Wrench, Sparkles, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import type { Workspace } from "@/types/workspace";

interface WorkspaceCardProps {
  workspace: Workspace;
  onClick?: (workspace: Workspace) => void;
  className?: string;
}

const domainIcons: Record<string, React.ElementType> = {
  auto: Sparkles,
  insurance_claims: ClipboardCheck,
  legal_contracts: Scale,
  financial_dd: TrendingUp,
  custom: Wrench,
};

const domainLabels: Record<string, string> = {
  auto: "Auto-detected",
  insurance_claims: "Insurance",
  legal_contracts: "Legal",
  financial_dd: "Financial",
  custom: "Custom",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  setup: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  archived: "bg-[var(--dv-bg-active)] text-[var(--dv-text-muted)] border-[var(--dv-border-default)]",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function WorkspaceCard({
  workspace,
  onClick,
  className,
}: WorkspaceCardProps) {
  const DomainIcon = domainIcons[workspace.domain] ?? Sparkles;

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left",
        "border-b border-[var(--dv-border-subtle)] last:border-b-0",
        "hover:bg-[var(--dv-bg-hover)] transition-colors cursor-pointer",
        className
      )}
      onClick={() => onClick?.(workspace)}
    >
      {/* Domain icon */}
      <div className="flex shrink-0 items-center justify-center size-8 rounded-lg bg-[var(--dv-bg-active)]">
        <DomainIcon className="size-4 text-[var(--dv-text-secondary)]" />
      </div>

      {/* Name + domain */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--dv-text-primary)] truncate">
            {workspace.name}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[10px] h-4 px-1.5 shrink-0", statusColors[workspace.status])}
          >
            {workspace.status}
          </Badge>
        </div>
        <p className="text-xs text-[var(--dv-text-muted)] mt-0.5">
          {domainLabels[workspace.domain]}
        </p>
      </div>

      {/* Metadata */}
      <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--dv-text-muted)] shrink-0">
        <span>{workspace.documentCount} docs</span>
        {workspace.lastCallAt && (
          <>
            <span className="w-0.5 h-0.5 rounded-full bg-[var(--dv-border-default)]" />
            <span>{formatTimestamp(workspace.lastCallAt)}</span>
          </>
        )}
        <span className="w-0.5 h-0.5 rounded-full bg-[var(--dv-border-default)]" />
        <span>{workspace.findingCount} findings</span>
      </div>

      {/* Chevron */}
      <ChevronRight className="size-4 text-[var(--dv-text-muted)] shrink-0" />
    </button>
  );
}
