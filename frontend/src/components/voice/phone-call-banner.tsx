"use client";

import { Phone } from "lucide-react";

import { cn } from "@/lib/utils";

interface PhoneCallBannerProps {
  callerInfo: string;
  isActive: boolean;
  className?: string;
}

export function PhoneCallBanner({
  callerInfo,
  isActive,
  className,
}: PhoneCallBannerProps) {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 slide-up",
        "bg-[var(--dv-wine-dim)]/30 border-b border-[var(--dv-wine)]/20",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Phone className="size-3.5 text-[var(--dv-wine)]" />
        <span className="text-xs font-medium text-[var(--dv-wine)]">
          Phone call active
        </span>
        <span className="text-xs text-[var(--dv-text-muted)]">
          — you and the caller share this session
        </span>
      </div>
      <span className="text-xs font-mono text-[var(--dv-text-secondary)]">
        {callerInfo}
      </span>
    </div>
  );
}
