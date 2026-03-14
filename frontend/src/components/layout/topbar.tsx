"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title = "Home" }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? theme === "dark" : false;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-4">
      <span className="text-sm font-medium text-[var(--dv-text-primary)]">
        {title}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              aria-label="Toggle dark mode"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={cn(
                "relative flex items-center h-7 w-14 rounded-full p-0.5 cursor-pointer",
                "transition-colors duration-300 ease-in-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dv-wine)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dv-bg-base)]",
                isDark
                  ? "bg-[var(--dv-bg-active)]"
                  : "bg-[var(--dv-border-default)]"
              )}
            >
              {/* Sun icon (left side) */}
              <Sun
                className={cn(
                  "absolute left-1.5 size-3.5 transition-opacity duration-300",
                  isDark ? "opacity-30 text-[var(--dv-text-muted)]" : "opacity-0"
                )}
              />

              {/* Moon icon (right side) */}
              <Moon
                className={cn(
                  "absolute right-1.5 size-3.5 transition-opacity duration-300",
                  isDark ? "opacity-0" : "opacity-30 text-[var(--dv-text-muted)]"
                )}
              />

              {/* Sliding knob */}
              <span
                className={cn(
                  "flex items-center justify-center",
                  "size-6 rounded-full shadow-sm",
                  "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  isDark
                    ? "translate-x-[1.75rem] bg-[var(--dv-bg-elevated)]"
                    : "translate-x-0 bg-white"
                )}
              >
                {isDark ? (
                  <Moon className="size-3.5 text-[var(--dv-text-secondary)]" />
                ) : (
                  <Sun className="size-3.5 text-amber-500" />
                )}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isDark ? "Switch to light mode" : "Switch to dark mode"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
