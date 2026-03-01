"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mic,
  Search,
  Clock,
  Settings,
  Settings2,
  AudioWaveform,
  LogOut,
  ChevronsLeft,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";

function extractWorkspaceId(pathname: string): string | null {
  const match = pathname.match(/\/workspace\/([^/]+)/);
  return match?.[1] ?? null;
}

const globalNavItems = [
  { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
];

const workspaceNavItems = [
  { label: "Voice Session", icon: Mic, path: "" },
  { label: "Session History", icon: Clock, path: "/sessions" },
  { label: "Findings", icon: Search, path: "/findings" },
  { label: "Workspace Settings", icon: Settings2, path: "/settings" },
];

const demoUser = {
  firstName: "Demo",
  fullName: "Demo User",
};

export function AppSidebar() {
  const pathname = usePathname();
  const workspaceId = extractWorkspaceId(pathname);
  const { toggleSidebar, open } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className="border-none"
    >
      {/* Edge collapse toggle — floats at the sidebar right edge */}
      <button
        onClick={toggleSidebar}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        className={cn(
          "absolute top-6 -right-3 z-50",
          "flex items-center justify-center",
          "size-6 rounded-full",
          "bg-[var(--dv-bg-elevated)] border border-[var(--dv-border-default)]",
          "text-[var(--dv-text-muted)] hover:text-[var(--dv-text-primary)]",
          "shadow-sm cursor-pointer",
          "opacity-0 transition-opacity duration-200",
          "group-hover:opacity-100",
        )}
      >
        <ChevronsLeft
          className={cn(
            "size-3.5 transition-transform duration-200",
            !open && "rotate-180",
          )}
        />
      </button>

      {/* Logo */}
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[var(--dv-wine)] text-white">
                  <AudioWaveform className="size-4" />
                </div>
                <span className="font-semibold text-sm">DocuVoice</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-[var(--dv-text-muted)]">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {globalNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workspace Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-[var(--dv-text-muted)]">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Workspace switcher */}
              <SidebarMenuItem>
                <WorkspaceSwitcher activeWorkspaceId={workspaceId} />
              </SidebarMenuItem>

              {/* Workspace-scoped navigation */}
              {workspaceId &&
                workspaceNavItems.map((item) => {
                  const href = `/workspace/${workspaceId}${item.path}`;
                  const isActive =
                    item.path === ""
                      ? pathname === `/workspace/${workspaceId}`
                      : pathname.startsWith(href);
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={href}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Global Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/settings"}
                  tooltip="Settings"
                >
                  <Link href="/settings">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-[var(--dv-bg-hover)]"
                >
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-[var(--dv-bg-active)] text-xs">
                      {demoUser.firstName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">
                    {demoUser.fullName}
                  </span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-48 bg-[var(--dv-bg-elevated)] border-[var(--dv-border-default)]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-400">
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  );
}
