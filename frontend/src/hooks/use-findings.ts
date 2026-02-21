"use client";

import { useWorkspaceStore } from "@/stores/workspace-store";

export function useFindings() {
  const { findings } = useWorkspaceStore();

  const criticalCount = findings.filter(
    (f) => f.severity === "critical" || f.severity === "high"
  ).length;

  return {
    findings,
    criticalCount,
    totalCount: findings.length,
  };
}
