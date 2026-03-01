"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <Topbar />
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
