"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FindingCard } from "@/components/findings/finding-card";
import { cn } from "@/lib/utils";
import type { Finding } from "@/types/finding";

interface FindingListProps {
  findings: Finding[];
  className?: string;
}

export function FindingList({ findings, className }: FindingListProps) {
  const criticalCount = findings.filter(
    (f) => f.severity === "critical" || f.severity === "high"
  ).length;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-xs font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider">
          Findings ({findings.length})
        </h3>
        {criticalCount > 0 && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            {criticalCount} critical
          </Badge>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-3 pb-3">
          {findings.map((finding, i) => (
            <div
              key={finding.id}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <FindingCard finding={finding} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
