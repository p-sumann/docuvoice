import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { FindingSeverity } from "@/types/finding";
import type { OrbState } from "@/types/voice";
import type { DocumentStatus } from "@/types/workspace";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(value: string): string {
  const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function truncateFilename(name: string, max = 24): string {
  if (name.length <= max) return name;
  const ext = name.lastIndexOf(".");
  if (ext === -1) return name.slice(0, max - 3) + "...";
  const extension = name.slice(ext);
  const base = name.slice(0, ext);
  const truncatedBase = base.slice(0, max - extension.length - 3);
  return truncatedBase + "..." + extension;
}

export function getSeverityColor(severity: FindingSeverity): string {
  const colors: Record<FindingSeverity, string> = {
    critical: "text-red-500 border-red-500",
    high: "text-red-400 border-red-400",
    medium: "text-amber-500 border-amber-500",
    low: "text-blue-400 border-blue-400",
    info: "text-cyan-400 border-cyan-400",
  };
  return colors[severity];
}

export function getSeverityBadgeVariant(
  severity: FindingSeverity
): "destructive" | "secondary" | "outline" | "default" {
  switch (severity) {
    case "critical":
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
    case "info":
      return "secondary";
  }
}

export function getStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    uploading: "text-amber-400",
    processing: "text-blue-400",
    ready: "text-emerald-400",
    error: "text-red-400",
  };
  return colors[status];
}

export function getOrbLabel(state: OrbState, toolName?: string | null): string {
  const labels: Record<OrbState, string> = {
    idle: "Click or press Space",
    connecting: "Connecting...",
    listening: "Listening...",
    speaking: "Speaking...",
    thinking: "Analyzing...",
    tool_call: toolName ? `Running ${toolName}...` : "Processing...",
    error: "Connection lost",
  };
  return labels[state];
}

export function formatSessionTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
