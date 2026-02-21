"use client";

import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
import { PanelRightOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { VoiceSessionController } from "@/components/voice/voice-session-controller";
import { VoiceTranscript } from "@/components/voice/voice-transcript";
import { SuggestedQuestions } from "@/components/voice/suggested-questions";
import { PhoneCallBanner } from "@/components/voice/phone-call-banner";
import { WorkspaceTopBar } from "@/components/workspace/workspace-top-bar";
import { DocumentPanel } from "@/components/workspace/document-panel";
import { PanelResizer } from "@/components/layout/panel-resizer";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/hooks/use-workspace";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { MOCK_SUGGESTED_QUESTIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>();
  const { workspace, documents, findings, extractedFields, isLoading } =
    useWorkspace(params.workspaceId);
  const voiceSession = useVoiceSession();

  const [docPanelWidth, setDocPanelWidth] = useState(40); // percentage

  const handleResize = useCallback((deltaX: number) => {
    setDocPanelWidth((prev) => {
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const next = prev - deltaPercent;
      return Math.max(25, Math.min(55, next));
    });
  }, []);

  if (isLoading || !workspace) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-28 h-28 rounded-full bg-[var(--dv-bg-surface)]" />
          <Skeleton className="w-32 h-4 bg-[var(--dv-bg-surface)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
      {/* Phone call banner */}
      <PhoneCallBanner
        callerInfo={voiceSession.phoneCallerInfo ?? ""}
        isActive={voiceSession.isPhoneCallActive}
      />

      {/* Workspace header */}
      <WorkspaceTopBar
        workspace={workspace}
        isSessionActive={voiceSession.isConnected}
        sessionDuration={voiceSession.sessionDuration}
        onEndSession={voiceSession.disconnect}
      />

      {/* Main 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center panel: Voice + Transcript */}
        <div
          className="flex flex-col flex-1 min-w-0"
          style={{ flex: `0 0 ${100 - docPanelWidth}%` }}
        >
          {/* Voice Orb */}
          <VoiceSessionController />

          {/* Transcript */}
          <VoiceTranscript
            entries={voiceSession.transcript}
            isLive={voiceSession.isConnected}
            sessionDuration={voiceSession.sessionDuration}
            className="flex-1 min-h-0"
          />

          {/* Suggested Questions */}
          <SuggestedQuestions
            questions={MOCK_SUGGESTED_QUESTIONS}
            onSelect={(q) => {
              voiceSession.toggle();
            }}
          />
        </div>

        {/* Panel resizer - desktop only */}
        <PanelResizer
          onResize={handleResize}
          className="hidden lg:flex"
        />

        {/* Document panel - desktop */}
        <div
          className={cn("hidden lg:flex")}
          style={{ flex: `0 0 ${docPanelWidth}%` }}
        >
          <DocumentPanel
            documents={documents}
            extractedFields={extractedFields}
            findings={findings}
            workspaceId={workspace.id}
            className="w-full"
          />
        </div>

        {/* Document panel - mobile/tablet: Sheet trigger */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-[var(--dv-wine)] hover:bg-[var(--dv-wine)]/90 shadow-lg"
              >
                <PanelRightOpen className="size-5 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[85vw] sm:w-[400px] bg-[var(--dv-bg-base)] border-[var(--dv-border-subtle)] p-0"
            >
              <DocumentPanel
                documents={documents}
                extractedFields={extractedFields}
                findings={findings}
                workspaceId={workspace.id}
                className="h-full pt-8"
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
