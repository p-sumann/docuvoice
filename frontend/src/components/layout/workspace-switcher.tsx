"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, FolderOpen } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface WorkspaceSwitcherProps {
  activeWorkspaceId: string | null;
}

export function WorkspaceSwitcher({
  activeWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const { workspaces } = useWorkspaceStore();
  const active = workspaces.find((ws) => ws.id === activeWorkspaceId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-[var(--dv-bg-hover)] w-full"
        >
          <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-[var(--dv-bg-active)]">
            <FolderOpen className="size-3.5 text-[var(--dv-wine-light)]" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="truncate text-sm font-medium text-[var(--dv-text-primary)]">
              {active?.name ?? "Select Workspace"}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4 text-[var(--dv-text-muted)]" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="right"
        sideOffset={4}
        className="w-64 bg-[var(--dv-bg-elevated)] border-[var(--dv-border-default)]"
      >
        {workspaces.length === 0 && (
          <div className="px-3 py-2 text-xs text-[var(--dv-text-muted)]">
            No workspaces yet
          </div>
        )}
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => router.push(`/workspace/${ws.id}`)}
            className={
              ws.id === activeWorkspaceId
                ? "bg-[var(--dv-bg-active)] text-[var(--dv-text-primary)]"
                : "text-[var(--dv-text-secondary)]"
            }
          >
            <FolderOpen className="mr-2 size-4" />
            <span className="truncate">{ws.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-[var(--dv-border-subtle)]" />
        <DropdownMenuItem
          onClick={() => router.push("/workspace/new")}
          className="text-[var(--dv-wine-light)]"
        >
          <Plus className="mr-2 size-4" />
          New Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
