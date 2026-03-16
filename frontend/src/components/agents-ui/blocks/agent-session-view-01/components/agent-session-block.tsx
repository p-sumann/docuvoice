'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { type MotionProps, motion, AnimatePresence } from 'motion/react';
import {
  useAgent,
  useSessionContext,
  useTranscriptions,
  useVoiceAssistant,
} from '@livekit/components-react';
import {
  AgentControlBar,
  type AgentControlBarControls,
} from '@/components/agents-ui/agent-control-bar';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { cn } from '@/lib/utils';
import {
  useLiveKitSessionActions,
  type PostSessionData,
} from '@/components/voice/livekit-session';
import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  Loader2,
  Bot,
  User,
  CheckCircle2,
  Download,
  RotateCcw,
  Clock,
  AudioWaveform,
  Mic,
  Search,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  FileWarning,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import type { Finding } from '@/types/finding';
import type { Document as WorkspaceDocument } from '@/types/workspace';

const BOTTOM_VIEW_MOTION_PROPS: MotionProps = {
  variants: {
    visible: { opacity: 1, translateY: '0%' },
    hidden: { opacity: 0, translateY: '100%' },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: { duration: 0.3, delay: 0.3, ease: 'easeOut' },
};

export function Fade({ bottom = false, className }: { top?: boolean; bottom?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        bottom && 'bg-linear-to-t',
        className,
      )}
    />
  );
}

function AgentStateIndicator({ state }: { state: string }) {
  const labels: Record<string, string> = {
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
    connecting: 'Connecting...',
    initializing: 'Initializing...',
  };

  return (
    <motion.p
      key={state}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-muted-foreground text-center text-xs font-medium tracking-wide"
    >
      {labels[state] ?? state}
    </motion.p>
  );
}

function InlineVisualizer() {
  const { state, audioTrack } = useVoiceAssistant();

  return (
    <AgentAudioVisualizerBar
      size="sm"
      state={state}
      audioTrack={audioTrack}
      barCount={5}
      className="h-[40px] gap-[3px] flex-1"
    >
      <span className="min-h-[6px] w-[6px] rounded-full transition-colors duration-250 ease-linear bg-current/10 data-[lk-highlighted=true]:bg-current" />
    </AgentAudioVisualizerBar>
  );
}

function TranscriptPanel() {
  const transcriptions = useTranscriptions();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Sync transcriptions to the session context ref for post-session capture.
  // Only update when transcriptions grow — never overwrite with empty (session disconnect clears them).
  const { transcriptRef } = useLiveKitSessionActions();
  useEffect(() => {
    if (transcriptions.length === 0) return;
    transcriptRef.current = transcriptions.map((t, i) => ({
      id: t.streamInfo?.id ?? `t-${i}`,
      role: t.participantInfo.identity === 'user' ? 'user' : 'agent',
      text: t.text,
      timestamp: t.streamInfo?.timestamp ?? Date.now(),
    }));
  }, [transcriptions, transcriptRef]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions.length, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setAutoScroll(isNearBottom);
  };

  if (transcriptions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Waiting for conversation...</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto px-4 [scrollbar-width:thin]"
    >
      <div className="mx-auto max-w-2xl space-y-3 py-4">
        {transcriptions.map((t, i) => {
          const isAgent = t.participantInfo.identity !== 'user';
          return (
            <div
              key={`${t.participantInfo.identity}-${i}`}
              className={cn('flex items-end gap-2', !isAgent && 'flex-row-reverse')}
            >
              <div
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  isAgent
                    ? 'bg-[var(--dv-wine)]/15 text-[var(--dv-wine)]'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {isAgent ? <Bot className="size-3" /> : <User className="size-3" />}
              </div>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2',
                  isAgent
                    ? 'bg-muted/60 rounded-bl-sm'
                    : 'bg-[var(--dv-wine)]/10 rounded-br-sm',
                )}
              >
                <p className="text-foreground text-sm leading-relaxed">{t.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Report Card Helpers                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function severityBadge(severity: Finding['severity']) {
  const map: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-500 border-red-500/30',
    high: 'bg-red-400/15 text-red-400 border-red-400/30',
    medium: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    low: 'bg-blue-400/15 text-blue-400 border-blue-400/30',
    info: 'bg-cyan-400/15 text-cyan-400 border-cyan-400/30',
  };
  return (
    <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider', map[severity])}>
      {severity}
    </span>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[var(--dv-border-subtle)] bg-[var(--dv-bg-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[var(--dv-bg-hover)]"
      >
        <Icon className="size-4 shrink-0 text-[var(--dv-text-muted)]" />
        <span className="text-sm font-medium text-[var(--dv-text-primary)] flex-1">{title}</span>
        {badge}
        {open ? (
          <ChevronUp className="size-3.5 text-[var(--dv-text-muted)]" />
        ) : (
          <ChevronDown className="size-3.5 text-[var(--dv-text-muted)]" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--dv-border-subtle)] px-4 py-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function buildReportPdf(
  data: PostSessionData,
  documents: WorkspaceDocument[],
  findings: Finding[],
  workspaceName: string,
): void {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const endDate = new Date(data.endedAt);

    const severityColors: Record<string, [number, number, number]> = {
      critical: [220, 38, 38],
      high: [239, 68, 68],
      medium: [217, 119, 6],
      low: [59, 130, 246],
      info: [6, 182, 212],
    };

    function checkPage(needed: number) {
      if (y + needed > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
    }

    function drawLine() {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;
    }

    // ── Header ──
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('DocuVoice Session Report', margin, y);
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const meta = [
      `Workspace: ${workspaceName}`,
      `Date: ${endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      `Duration: ${formatDuration(data.duration)}`,
      `Documents: ${documents.length}  |  Findings: ${findings.length}`,
    ];
    for (const line of meta) {
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 2;
    drawLine();

    // ── Findings ──
    if (findings.length > 0) {
      checkPage(14);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`Findings (${findings.length})`, margin, y);
      y += 7;

      for (const f of findings) {
        checkPage(20);

        // Severity badge
        const color = severityColors[f.severity] ?? [100, 100, 100];
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const badge = f.severity.toUpperCase();
        const badgeW = doc.getTextWidth(badge) + 4;
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(margin, y - 3, badgeW, 4.5, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(badge, margin + 2, y);

        // Title
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text(f.title, margin + badgeW + 3, y);
        y += 5;

        // Description
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);
        const descLines = doc.splitTextToSize(f.description, contentWidth - 4);
        for (const dl of descLines) {
          checkPage(5);
          doc.text(dl, margin + 2, y);
          y += 4;
        }

        if (f.documentRefs.length > 0) {
          doc.setFontSize(7.5);
          doc.setTextColor(140, 140, 140);
          doc.text(`Sources: ${f.documentRefs.join(', ')}`, margin + 2, y);
          y += 4;
        }
        y += 2;
      }
      drawLine();
    }

    // ── Documents Reviewed ──
    if (documents.length > 0) {
      checkPage(14);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`Documents Reviewed (${documents.length})`, margin, y);
      y += 7;

      for (const d of documents) {
        checkPage(8);
        const typeLabel = d.documentType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(d.filename, margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(` - ${typeLabel}`, margin + 2 + doc.getTextWidth(d.filename + ' '), y);
        y += 5;
      }
      y += 2;
      drawLine();
    }

    // ── Conversation Transcript ──
    checkPage(14);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`Conversation (${data.transcript.length} messages)`, margin, y);
    y += 7;

    if (data.transcript.length > 0) {
      for (const msg of data.transcript) {
        checkPage(10);
        const role = msg.role === 'agent' ? 'DocuVoice' : 'You';
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(msg.role === 'agent' ? 120 : 80, 40, msg.role === 'agent' ? 80 : 40);
        doc.text(`${role}:`, margin + 2, y);
        const roleWidth = doc.getTextWidth(`${role}: `);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 70);
        const textLines = doc.splitTextToSize(msg.text, contentWidth - roleWidth - 4);
        doc.text(textLines[0], margin + 2 + roleWidth, y);
        y += 4;
        for (let i = 1; i < textLines.length; i++) {
          checkPage(5);
          doc.text(textLines[i], margin + 4, y);
          y += 4;
        }
        y += 1;
      }
    } else {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('No transcript was captured for this session.', margin + 2, y);
      y += 6;
    }

    // ── Footer ──
    y += 4;
    drawLine();
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(170, 170, 170);
    doc.text(`Generated by DocuVoice on ${endDate.toISOString()}`, margin, y);

    doc.save(`docuvoice-report-${endDate.toISOString().slice(0, 10)}.pdf`);
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Post-Session Report Card                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function PostSessionView({
  data,
  onNewSession,
}: {
  data: PostSessionData;
  onNewSession: () => void;
}) {
  const { documents: allDocuments, findings, activeWorkspace } = useWorkspaceStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Only show documents that were successfully processed
  const documents = allDocuments.filter((d) => d.status === 'ready');
  const criticalCount = findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length;
  const endDate = new Date(data.endedAt);

  const handleDownload = useCallback(() => {
    buildReportPdf(data, documents, findings, activeWorkspace?.name ?? 'Workspace');
  }, [data, documents, findings, activeWorkspace?.name]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto [scrollbar-width:thin]">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="size-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-foreground text-base font-semibold">Session Report</h2>
                <p className="text-muted-foreground text-xs">
                  {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' at '}
                  {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                title="Download report"
                className="flex size-8 items-center justify-center rounded-lg border border-[var(--dv-border-default)] bg-[var(--dv-bg-surface)] text-[var(--dv-text-muted)] transition-colors hover:bg-[var(--dv-bg-hover)] hover:text-[var(--dv-text-primary)]"
              >
                <Download className="size-3.5" />
              </button>
              <button
                onClick={onNewSession}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--dv-wine)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--dv-wine)]/90"
              >
                <RotateCcw className="size-3" />
                Back to Workspace
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[var(--dv-border-subtle)] bg-[var(--dv-bg-surface)] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[var(--dv-text-muted)]">
                <Clock className="size-3" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Duration</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[var(--dv-text-primary)]">
                {formatDuration(data.duration)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--dv-border-subtle)] bg-[var(--dv-bg-surface)] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[var(--dv-text-muted)]">
                <FileText className="size-3" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Documents</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[var(--dv-text-primary)]">
                {documents.length}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--dv-border-subtle)] bg-[var(--dv-bg-surface)] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[var(--dv-text-muted)]">
                <Shield className="size-3" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Findings</span>
              </div>
              <p className={cn('mt-1 text-sm font-semibold', criticalCount > 0 ? 'text-red-400' : 'text-[var(--dv-text-primary)]')}>
                {findings.length}
                {criticalCount > 0 && (
                  <span className="ml-1 text-[10px] font-normal text-red-400">({criticalCount} critical/high)</span>
                )}
              </p>
            </div>
          </div>

          {/* Findings */}
          {findings.length > 0 && (
            <CollapsibleSection
              title={`Findings (${findings.length})`}
              icon={FileWarning}
              badge={
                criticalCount > 0 ? (
                  <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                    {criticalCount} action needed
                  </span>
                ) : undefined
              }
            >
              <div className="space-y-3">
                {findings.map((f) => (
                  <div key={f.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      {severityBadge(f.severity)}
                      <span className="text-sm font-medium text-[var(--dv-text-primary)]">{f.title}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--dv-text-secondary)] pl-1">
                      {f.description}
                    </p>
                    {f.documentRefs.length > 0 && (
                      <p className="text-[10px] text-[var(--dv-text-muted)] pl-1">
                        Sources: {f.documentRefs.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Documents Reviewed */}
          {documents.length > 0 && (
            <CollapsibleSection
              title={`Documents Reviewed (${documents.length})`}
              icon={FileText}
              defaultOpen={false}
            >
              <div className="space-y-2">
                {documents.map((doc) => {
                  const typeLabel = doc.documentType
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <div key={doc.id} className="flex items-center gap-2.5">
                      <FileText className="size-3.5 shrink-0 text-[var(--dv-text-muted)]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-[var(--dv-text-primary)]">{doc.filename}</p>
                        <p className="text-[10px] text-[var(--dv-text-muted)]">{typeLabel}</p>
                      </div>
                      <span className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        doc.status === 'ready'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500',
                      )}>
                        {doc.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* Conversation Transcript */}
          <CollapsibleSection
            title={`Conversation (${data.transcript.length} messages)`}
            icon={Mic}
            defaultOpen={data.transcript.length <= 12}
          >
            {data.transcript.length > 0 ? (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto [scrollbar-width:thin]">
                {data.transcript.map((msg) => {
                  const isAgent = msg.role === 'agent';
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex items-start gap-2', !isAgent && 'flex-row-reverse')}
                    >
                      <div
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-full mt-0.5',
                          isAgent
                            ? 'bg-[var(--dv-wine)]/15 text-[var(--dv-wine)]'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {isAgent ? <Bot className="size-2.5" /> : <User className="size-2.5" />}
                      </div>
                      <div
                        className={cn(
                          'max-w-[80%] rounded-xl px-3 py-1.5',
                          isAgent
                            ? 'bg-muted/60 rounded-bl-sm'
                            : 'bg-[var(--dv-wine)]/10 rounded-br-sm',
                        )}
                      >
                        <p className="text-xs leading-relaxed text-[var(--dv-text-secondary)]">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--dv-text-muted)] italic">No transcript was captured for this session.</p>
            )}
          </CollapsibleSection>
        </motion.div>
      </div>
    </div>
  );
}

export interface AgentSessionView_01Props {
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;
  className?: string;
}

function ConnectedSessionView() {
  const session = useSessionContext();
  const { state: agentState } = useAgent();

  const controls: AgentControlBarControls = {
    leave: true,
    microphone: true,
    chat: false,
    camera: false,
    screenShare: false,
  };

  return (
    <>
      {/* Agent state indicator at top */}
      <div className="flex justify-center pt-4 pb-2">
        <AgentStateIndicator state={agentState} />
      </div>

      {/* Scrollable transcript */}
      <div className="absolute inset-x-0 top-[40px] bottom-[80px] z-[45] md:bottom-[100px]">
        <TranscriptPanel />
      </div>

      {/* Bottom controls */}
      <motion.div
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="absolute inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        <div className="bg-background relative mx-auto max-w-2xl pb-3 md:pb-6">
          <Fade bottom className="absolute inset-x-0 top-0 h-8 -translate-y-full" />
          <div
            aria-label="Voice assistant controls"
            className="bg-background border-input/50 dark:border-muted flex items-center gap-2 rounded-[31px] border p-3 drop-shadow-md/3"
          >
            <AgentControlBar
              variant="livekit"
              controls={{ ...controls, leave: false }}
              isConnected={session.isConnected}
              onDisconnect={session.end}
              className="border-0 p-0 shadow-none drop-shadow-none"
            />
            <InlineVisualizer />
            <AgentControlBar
              variant="livekit"
              controls={{ leave: true, microphone: false, chat: false, camera: false, screenShare: false }}
              isConnected={session.isConnected}
              onDisconnect={session.end}
              className="border-0 p-0 shadow-none drop-shadow-none"
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}

export function AgentSessionView_01({
  ref,
  className,
  ...props
}: React.ComponentProps<'section'> & AgentSessionView_01Props) {
  const { startSession, dismissPostSession, phase, postSessionData } = useLiveKitSessionActions();

  return (
    <section
      ref={ref}
      className={cn('bg-background relative z-10 h-full w-full overflow-hidden', className)}
      {...props}
    >
      {phase === 'connected' && <ConnectedSessionView />}

      {phase === 'ended' && postSessionData && (
        <PostSessionView
          data={postSessionData}
          onNewSession={() => {
            dismissPostSession();
          }}
        />
      )}

      {(phase === 'idle' || phase === 'connecting') && (
        <div className="flex h-full flex-col items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            {/* Logo + title */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--dv-wine)]/10">
                <AudioWaveform className="size-7 text-[var(--dv-wine)]" />
              </div>
              <div className="text-center">
                <h2 className="text-foreground text-lg font-semibold">Voice Session</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Start a conversation to analyze your documents
                </p>
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-center text-xs font-medium uppercase tracking-wider">
                Try asking
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { icon: FileText, text: 'Walk me through this claim' },
                  { icon: Search, text: 'Any discrepancies between docs?' },
                  { icon: AlertTriangle, text: 'Flag anything that worries me' },
                  { icon: Mic, text: 'Generate adjuster notes' },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2.5 rounded-lg border border-[var(--dv-border-subtle)] bg-[var(--dv-bg-surface)] px-3 py-2.5"
                  >
                    <item.icon className="size-3.5 shrink-0 text-[var(--dv-text-muted)]" />
                    <span className="text-xs text-[var(--dv-text-secondary)]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Start button or connecting */}
            <div className="flex justify-center">
              {phase === 'idle' ? (
                <button
                  onClick={startSession}
                  className="rounded-full bg-[var(--dv-wine)] px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[var(--dv-wine)]/90 hover:shadow-xl active:scale-95"
                >
                  Start Session
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                  <span className="text-muted-foreground text-sm font-medium">Connecting...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
