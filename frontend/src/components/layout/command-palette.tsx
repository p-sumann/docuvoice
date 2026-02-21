"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Plus,
  Upload,
  Mic,
  Settings,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { MOCK_WORKSPACES } from "@/lib/mock-data";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search workspaces, documents, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Workspaces">
          {MOCK_WORKSPACES.map((ws) => (
            <CommandItem
              key={ws.id}
              onSelect={() => navigate(`/workspace/${ws.id}`)}
            >
              <FileText className="mr-2 size-4 text-[var(--dv-text-secondary)]" />
              <span>{ws.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => navigate("/workspace/new")}>
            <Plus className="mr-2 size-4 text-[var(--dv-wine)]" />
            <span>Create Workspace</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/workspace/new")}>
            <Upload className="mr-2 size-4 text-[var(--dv-emerald)]" />
            <span>Upload Document</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard")}>
            <Mic className="mr-2 size-4 text-[var(--dv-wine-light)]" />
            <span>Start Voice Session</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate("/dashboard")}>
            <LayoutDashboard className="mr-2 size-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings")}>
            <Settings className="mr-2 size-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
