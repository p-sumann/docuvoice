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
          tooltip={active?.name ?? "Select Workspace"}
          className="data-[state=open]:bg-[var(--dv-bg-hover)]"
        >
          <FolderOpen className="size-4" />
          <span className="truncate">
            {active?.name ?? "Select Workspace"}
          </span>
          <ChevronsUpDown className="ml-auto size-3.5 text-[var(--dv-text-muted)]" />
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
        >
          <Plus className="mr-2 size-4" />
          New Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
