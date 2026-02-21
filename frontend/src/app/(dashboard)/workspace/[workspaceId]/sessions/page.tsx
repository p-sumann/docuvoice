"use client";

import { useParams, useRouter } from "next/navigation";
import { Mic, Phone } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionHistory } from "@/hooks/use-session-history";
import { formatTimestamp, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SessionChannel } from "@/types/workspace";

const filterOptions: { label: string; value: SessionChannel | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Web", value: "web" },
  { label: "Phone", value: "phone" },
];

export default function SessionHistoryPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const { sessions, isLoading, filter, setFilter } = useSessionHistory(
    params.workspaceId
  );

  return (
    <div className="page-enter p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--dv-text-primary)]">
          Session History
        </h1>

        {/* Filter pills */}
        <div className="flex gap-1">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-7 px-3 text-xs",
                filter === opt.value
                  ? "bg-[var(--dv-wine)] text-white"
                  : "text-[var(--dv-text-muted)]"
              )}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className="h-12 bg-[var(--dv-bg-surface)]"
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Mic className="size-8 text-[var(--dv-text-muted)] mb-3" />
          <p className="text-sm text-[var(--dv-text-muted)]">
            No sessions yet. Start a voice session to see history here.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--dv-border-subtle)] bg-[var(--dv-bg-surface)]">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--dv-border-subtle)] hover:bg-transparent">
                <TableHead className="text-xs text-[var(--dv-text-muted)]">
                  Date
                </TableHead>
                <TableHead className="text-xs text-[var(--dv-text-muted)]">
                  Channel
                </TableHead>
                <TableHead className="text-xs text-[var(--dv-text-muted)]">
                  Duration
                </TableHead>
                <TableHead className="text-xs text-[var(--dv-text-muted)]">
                  Findings
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow
                  key={session.id}
                  className="border-[var(--dv-border-subtle)] hover:bg-[var(--dv-bg-hover)] cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/workspace/${params.workspaceId}/sessions/${session.id}`
                    )
                  }
                >
                  <TableCell className="text-sm text-[var(--dv-text-primary)]">
                    {formatTimestamp(session.startedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {session.channel === "web" ? (
                        <Mic className="size-3 text-[var(--dv-wine)]" />
                      ) : (
                        <Phone className="size-3 text-[var(--dv-emerald)]" />
                      )}
                      <span className="text-xs text-[var(--dv-text-secondary)] capitalize">
                        {session.channel}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-[var(--dv-text-secondary)]">
                    {formatDuration(session.durationSeconds)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        session.findingCount > 0 ? "default" : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {session.findingCount}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
