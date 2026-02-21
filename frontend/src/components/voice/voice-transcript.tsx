"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, User, FileText, Settings2 } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatSessionTime } from "@/lib/utils";
import type { TranscriptEntry } from "@/types/workspace";

interface VoiceTranscriptProps {
  entries: TranscriptEntry[];
  isLive: boolean;
  sessionDuration?: number;
  className?: string;
}

function TranscriptMessage({ entry }: { entry: TranscriptEntry }) {
  const isAgent = entry.role === "agent";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-2 slide-up",
        "hover:bg-[var(--dv-bg-hover)] transition-colors"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full mt-0.5",
          isAgent
            ? "bg-[var(--dv-wine)]/20 text-[var(--dv-wine)]"
            : "bg-[var(--dv-wine-light)]/20 text-[var(--dv-wine-light)]"
        )}
      >
        {isAgent ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-[var(--dv-text-secondary)]">
            {isAgent ? "Agent" : "You"}
          </span>
          <span className="text-[10px] font-mono text-[var(--dv-text-muted)]">
            {formatSessionTime(entry.timestamp)}
          </span>
        </div>

        {/* Tool call indicator */}
        {entry.toolCall && (
          <div className="flex items-center gap-1.5 mt-1 mb-1">
            <Settings2 className="size-3 text-[var(--dv-amber)]" />
            <span className="text-xs font-mono text-[var(--dv-amber)]">
              {entry.toolCall}
            </span>
          </div>
        )}

        {/* Document reference */}
        {entry.documentRef && (
          <div className="flex items-center gap-1.5 mt-1 mb-1">
            <FileText className="size-3 text-[var(--dv-cyan)]" />
            <span className="text-xs text-[var(--dv-cyan)]">
              {entry.documentRef}
            </span>
          </div>
        )}

        {/* Message text */}
        <p className="text-sm text-[var(--dv-text-primary)] leading-relaxed">
          {entry.text}
        </p>
      </div>
    </div>
  );
}

export function VoiceTranscript({
  entries,
  isLive,
  sessionDuration = 0,
  className,
}: VoiceTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll when new entries arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setAutoScroll(isNearBottom);
  };

  return (
    <div className={cn("flex flex-col flex-1 min-h-0", className)}>
      {/* Header */}
      {isLive && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--dv-border-subtle)]">
          <div className="flex items-center gap-1.5">
            <span className="live-dot w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-400">LIVE</span>
          </div>
          <span className="text-xs font-mono text-[var(--dv-text-muted)]">
            {formatSessionTime(sessionDuration)}
          </span>
          <Badge variant="outline" className="text-[10px] h-5">
            Web
          </Badge>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef} onScrollCapture={handleScroll}>
        <div className="py-2">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-[var(--dv-text-muted)]">
                Click the orb or press Space to start a session
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <TranscriptMessage key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
