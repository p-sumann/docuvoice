"use client";

import { FindingCard } from "@/components/findings/finding-card";
import { cn } from "@/lib/utils";
import type { Finding } from "@/types/finding";

interface FindingListProps {
  findings: Finding[];
  className?: string;
}

export function FindingList({ findings, className }: FindingListProps) {
  return (
    <div className={cn("flex flex-col", className)}>
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
    </div>
  );
}
