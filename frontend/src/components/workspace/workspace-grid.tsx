"use client";

import { Plus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
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
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
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
      <Card
        className={cn(
          "border-2 border-dashed border-[var(--dv-border-default)]",
          "bg-transparent hover:bg-[var(--dv-bg-surface)]",
          "hover:border-[var(--dv-border-strong)]",
          "transition-all duration-200 cursor-pointer"
        )}
        onClick={onCreateWorkspace}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[120px]">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--dv-bg-active)] mb-2">
            <Plus className="size-5 text-[var(--dv-text-muted)]" />
          </div>
          <p className="text-sm text-[var(--dv-text-muted)]">
            Create Workspace
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
