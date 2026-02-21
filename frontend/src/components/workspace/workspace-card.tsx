"use client";

import { ClipboardCheck, Scale, TrendingUp, Wrench } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import type { Workspace, DomainType } from "@/types/workspace";

interface WorkspaceCardProps {
  workspace: Workspace;
  onClick?: (workspace: Workspace) => void;
  className?: string;
}

const domainIcons: Record<DomainType, React.ElementType> = {
  insurance_claims: ClipboardCheck,
  legal_contracts: Scale,
  financial_dd: TrendingUp,
  custom: Wrench,
};

const domainLabels: Record<DomainType, string> = {
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
  const DomainIcon = domainIcons[workspace.domain];

  return (
    <Card
      className={cn(
        "bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]",
        "hover:bg-[var(--dv-bg-hover)] hover:border-[var(--dv-border-default)]",
        "hover:scale-[1.01] transition-all duration-200 cursor-pointer",
        className
      )}
      onClick={() => onClick?.(workspace)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Domain icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--dv-bg-active)]">
            <DomainIcon className="size-5 text-[var(--dv-text-secondary)]" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + status */}
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--dv-text-primary)] truncate">
                {workspace.name}
              </h3>
              <Badge
                variant="outline"
                className={cn("text-[10px] h-4 px-1.5", statusColors[workspace.status])}
              >
                {workspace.status}
              </Badge>
            </div>

            {/* Domain label */}
            <p className="text-xs text-[var(--dv-text-muted)] mt-0.5">
              {domainLabels[workspace.domain]}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--dv-text-muted)]">
              <span>{workspace.documentCount} docs</span>
              <span className="w-0.5 h-0.5 rounded-full bg-[var(--dv-border-default)]" />
              {workspace.lastCallAt && (
                <>
                  <span>Last call {formatTimestamp(workspace.lastCallAt)}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-[var(--dv-border-default)]" />
                </>
              )}
              <span>{workspace.findingCount} findings</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
