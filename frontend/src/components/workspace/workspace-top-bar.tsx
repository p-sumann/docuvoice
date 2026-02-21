"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSessionTime } from "@/lib/utils";
import type { Workspace } from "@/types/workspace";

interface WorkspaceTopBarProps {
  workspace: Workspace;
  isSessionActive: boolean;
  sessionDuration: number;
  onEndSession?: () => void;
  className?: string;
}

const domainLabels: Record<string, string> = {
  insurance_claims: "Insurance Claims",
  legal_contracts: "Legal Contracts",
  financial_dd: "Financial DD",
  custom: "Custom",
};

export function WorkspaceTopBar({
  workspace,
  isSessionActive,
  sessionDuration,
  onEndSession,
  className,
}: WorkspaceTopBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-[var(--dv-border-subtle)]",
        className
      )}
    >
      {/* Left: workspace info */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-sm font-semibold text-[var(--dv-text-primary)] truncate">
          {workspace.name}
        </h2>
        <Badge
          variant="outline"
          className="text-[10px] h-4 px-1.5 border-[var(--dv-border-default)] flex-shrink-0"
        >
          {domainLabels[workspace.domain]}
        </Badge>
      </div>

      {/* Right: session info */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {isSessionActive && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="live-dot w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-mono text-[var(--dv-text-secondary)]">
                {formatSessionTime(sessionDuration)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={onEndSession}
            >
              <PhoneOff className="size-3 mr-1" />
              End
            </Button>
          </>
        )}

        {workspace.phoneNumber && !isSessionActive && (
          <span className="text-[10px] font-mono text-[var(--dv-text-muted)]">
            {workspace.phoneNumber}
          </span>
        )}
      </div>
    </div>
  );
}
