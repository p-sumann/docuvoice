"use client";

import { useRouter } from "next/navigation";
import { FolderOpen, Mic, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceGrid } from "@/components/workspace/workspace-grid";
import { Badge } from "@/components/ui/badge";
import { useWorkspaces } from "@/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_STATS, MOCK_SESSIONS } from "@/lib/mock-data";
import { formatDuration, formatTimestamp } from "@/lib/utils";

function StatsCards() {
  const stats = [
    {
      label: "Workspaces",
      value: MOCK_STATS.totalWorkspaces,
      icon: FolderOpen,
      color: "text-[var(--dv-wine)]",
    },
    {
      label: "Sessions",
      value: MOCK_STATS.totalSessions,
      icon: Mic,
      color: "text-[var(--dv-wine-light)]",
    },
    {
      label: "Minutes Used",
      value: MOCK_STATS.totalMinutesUsed,
      icon: Clock,
      color: "text-[var(--dv-emerald)]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]"
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--dv-bg-active)]">
              <stat.icon className={`size-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--dv-text-primary)]">
                {stat.value}
              </p>
              <p className="text-xs text-[var(--dv-text-muted)]">
                {stat.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentSessions() {
  const sessions = MOCK_SESSIONS.slice(0, 3);

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-center gap-4 p-3 rounded-lg bg-[var(--dv-bg-surface)] border border-[var(--dv-border-subtle)] hover:bg-[var(--dv-bg-hover)] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--dv-bg-active)]">
            {session.channel === "web" ? (
              <Mic className="size-4 text-[var(--dv-wine)]" />
            ) : (
              <span className="text-xs">📞</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--dv-text-primary)]">
              Voice session
            </p>
            <p className="text-xs text-[var(--dv-text-muted)]">
              {formatTimestamp(session.startedAt)} &middot;{" "}
              {formatDuration(session.durationSeconds)}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {session.findingCount} findings
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { workspaces, isLoading } = useWorkspaces();

  return (
    <div className="page-enter p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--dv-text-primary)]">
          Welcome back
        </h1>
        <p className="text-sm text-[var(--dv-text-muted)] mt-1">
          Here&apos;s an overview of your document workspaces.
        </p>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Workspaces */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider mb-4">
          Workspaces
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-[120px] bg-[var(--dv-bg-surface)]"
              />
            ))}
          </div>
        ) : (
          <WorkspaceGrid
            workspaces={workspaces}
            onWorkspaceClick={(ws) => router.push(`/workspace/${ws.id}`)}
            onCreateWorkspace={() => router.push("/workspace/new")}
          />
        )}
      </section>

      {/* Recent Sessions */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider mb-4">
          Recent Sessions
        </h2>
        <RecentSessions />
      </section>
    </div>
  );
}
