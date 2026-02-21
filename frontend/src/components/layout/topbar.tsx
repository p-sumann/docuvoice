"use client";

import { Search } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  title?: string;
  onOpenCommandPalette?: () => void;
}

export function Topbar({ title = "Home", onOpenCommandPalette }: TopbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--dv-border-subtle)] px-4">
      <SidebarTrigger className="-ml-1 text-[var(--dv-text-secondary)] hover:text-[var(--dv-text-primary)]" />
      <Separator orientation="vertical" className="mx-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm text-[var(--dv-text-primary)]">
              {title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 h-8 px-3 text-xs text-[var(--dv-text-muted)] border-[var(--dv-border-default)] bg-[var(--dv-bg-surface)]"
          onClick={onOpenCommandPalette}
        >
          <Search className="size-3" />
          <span>Search</span>
          <kbd className="ml-2 rounded bg-[var(--dv-bg-active)] px-1.5 py-0.5 text-[10px] font-mono">
            ⌘K
          </kbd>
        </Button>
      </div>
    </header>
  );
}
