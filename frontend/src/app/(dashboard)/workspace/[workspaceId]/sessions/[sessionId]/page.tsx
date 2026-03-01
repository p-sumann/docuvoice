"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VoiceTranscript } from "@/components/voice/voice-transcript";
import { FindingList } from "@/components/findings/finding-list";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTranscript, fetchSession, fetchFindings } from "@/lib/api";
import { formatDuration, formatTimestamp } from "@/lib/utils";
import type { TranscriptEntry, Session } from "@/types/workspace";
import type { Finding } from "@/types/finding";

export default function SessionDetailPage() {
  const params = useParams<{ workspaceId: string; sessionId: string }>();
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionFindings, setSessionFindings] = useState<Finding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchSession(params.sessionId),
      fetchTranscript(params.sessionId),
      fetchFindings(params.workspaceId),
    ])
      .then(([sess, entries, findings]) => {
        setSession(sess);
        setTranscript(entries);
        setSessionFindings(
          findings.filter((f) => f.sessionId === params.sessionId)
        );
      })
      .finally(() => setIsLoading(false));
  }, [params.sessionId, params.workspaceId]);

  if (isLoading || !session) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-[var(--dv-bg-surface)]" />
        <Skeleton className="h-[400px] bg-[var(--dv-bg-surface)]" />
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--dv-border-subtle)]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href={`/workspace/${params.workspaceId}/sessions`}>
              <ArrowLeft className="size-4 text-[var(--dv-text-secondary)]" />
            </Link>
          </Button>
          <div>
            <h1 className="text-sm font-semibold text-[var(--dv-text-primary)]">
              Session Detail
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[var(--dv-text-muted)]">
                {formatTimestamp(session.startedAt)}
              </span>
              <Badge variant="outline" className="text-[10px] h-4 capitalize">
                {session.channel}
              </Badge>
              <span className="text-xs font-mono text-[var(--dv-text-muted)]">
                {formatDuration(session.durationSeconds)}
              </span>
            </div>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-[var(--dv-border-default)]"
              disabled
            >
              <Download className="size-3 mr-1" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Transcript */}
        <div className="flex-1 min-w-0 lg:flex-[0_0_65%]">
          <VoiceTranscript
            entries={transcript}
            isLive={false}
            className="h-full"
          />
        </div>

        {/* Findings sidebar */}
        <div className="hidden lg:flex flex-col lg:flex-[0_0_35%] border-l border-[var(--dv-border-subtle)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
            <h3 className="text-xs font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider">
              Findings ({sessionFindings.length})
            </h3>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <FindingList findings={sessionFindings} />
          </div>
        </div>
      </div>
    </div>
  );
}
