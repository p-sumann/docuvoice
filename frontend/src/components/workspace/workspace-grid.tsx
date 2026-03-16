"use client";

import { Plus } from "lucide-react";

import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types/workspace";

interface WorkspaceGridProps {
  workspaces: Workspace[];
  onWorkspaceClick?: (workspace: Workspace) => void;
  onCreateWorkspace?: () => void;
  className?: string;
}

export function WorkspaceGrid({
  workspaces,
  onWorkspaceClick,
  onCreateWorkspace,
  className,
}: WorkspaceGridProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--dv-border-subtle)] bg-[var(--dv-bg-surface)] overflow-hidden",
        className
      )}
    >
      {workspaces.map((ws) => (
        <WorkspaceCard
          key={ws.id}
          workspace={ws}
          onClick={onWorkspaceClick}
        />
      ))}

      {/* Create workspace CTA */}
      <button
        onClick={onCreateWorkspace}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3",
          "border-t border-dashed border-[var(--dv-border-default)]",
          "hover:bg-[var(--dv-bg-hover)] transition-colors cursor-pointer",
          workspaces.length === 0 && "border-t-0"
        )}
      >
        <div className="flex items-center justify-center size-8 rounded-full bg-[var(--dv-bg-active)]">
          <Plus className="size-4 text-[var(--dv-text-muted)]" />
        </div>
        <span className="text-sm text-[var(--dv-text-muted)]">
          Create Workspace
        </span>
      </button>
    </div>
  );
}
