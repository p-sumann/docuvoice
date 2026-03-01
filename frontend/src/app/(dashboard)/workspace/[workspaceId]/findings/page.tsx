"use client";

import { useParams } from "next/navigation";
import { Search } from "lucide-react";

import { FindingList } from "@/components/findings/finding-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/hooks/use-workspace";

export default function FindingsPage() {
  const params = useParams<{ workspaceId: string }>();
  const { findings, isLoading } = useWorkspace(params.workspaceId);

  return (
    <div className="page-enter h-full overflow-auto p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[var(--dv-text-primary)]">
        Findings
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 bg-[var(--dv-bg-surface)]" />
          ))}
        </div>
      ) : findings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="size-8 text-[var(--dv-text-muted)] mb-3" />
          <p className="text-sm text-[var(--dv-text-muted)]">
            No findings yet. Start a voice session to discover insights.
          </p>
        </div>
      ) : (
        <FindingList findings={findings} />
      )}
    </div>
  );
}
