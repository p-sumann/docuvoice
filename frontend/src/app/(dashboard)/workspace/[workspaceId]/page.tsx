"use client";

import { useParams } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { PanelRightOpen } from "lucide-react";
import {
  useAgent,
  useSessionContext,
  useSessionMessages,
} from "@livekit/components-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura";
import { AgentChatTranscript } from "@/components/agents-ui/agent-chat-transcript";
import { AgentControlBar } from "@/components/agents-ui/agent-control-bar";
import { SuggestedQuestions } from "@/components/voice/suggested-questions";
import { PhoneCallBanner } from "@/components/voice/phone-call-banner";
import { WorkspaceTopBar } from "@/components/workspace/workspace-top-bar";
import { DocumentPanel } from "@/components/workspace/document-panel";
import { PanelResizer } from "@/components/layout/panel-resizer";
import { LiveKitSession } from "@/components/voice/livekit-session";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/hooks/use-workspace";
import { useVoiceStore } from "@/stores/voice-store";
import { fetchSuggestedQuestions } from "@/lib/api";
import type { SuggestedQuestion } from "@/types/voice";

function WorkspaceContent({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { workspace, documents, findings, extractedFields, isLoading } =
    useWorkspace(workspaceId);
  const store = useVoiceStore();

  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages();

  const [docPanelWidth, setDocPanelWidth] = useState(40);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);

  // Session duration timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (session.isConnected) {
      timerRef.current = setInterval(() => {
        store.setSessionDuration(store.sessionDuration + 1);
      }, 1000);
    } else {
      store.setSessionDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session.isConnected]);

  useEffect(() => {
    fetchSuggestedQuestions(workspaceId).then(setSuggestedQuestions);
  }, [workspaceId]);

  const handleResize = useCallback((deltaX: number) => {
    setDocPanelWidth((prev) => {
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const next = prev - deltaPercent;
      return Math.max(25, Math.min(55, next));
    });
  }, []);

  const handleDisconnect = useCallback(() => {
    session.end();
    store.resetSession();
  }, [session, store]);

  const audioTrack =
    agent.state === "listening" ||
    agent.state === "thinking" ||
    agent.state === "speaking"
      ? agent.microphoneTrack
      : undefined;

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
      <PhoneCallBanner
        callerInfo={store.phoneCallerInfo ?? ""}
        isActive={store.isPhoneCallActive}
      />

      <WorkspaceTopBar
        workspace={workspace}
        isSessionActive={session.isConnected}
        sessionDuration={store.sessionDuration}
        onEndSession={handleDisconnect}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Center: Aura + Transcript + Suggestions + Controls */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Aura visualizer */}
          <div className="flex items-center justify-center py-4 shrink-0">
            <AgentAudioVisualizerAura
              size="md"
              state={agent.state ?? "idle"}
              audioTrack={audioTrack}
            />
          </div>

          {/* Chat transcript */}
          <AgentChatTranscript
            agentState={agent.state}
            messages={messages}
            className="flex-1 min-h-0"
          />

          {/* Suggestion chips */}
          <SuggestedQuestions
            questions={suggestedQuestions}
            onSelect={(q) => {
              // TODO: send text question via session.send() when chat is wired
            }}
          />

          {/* Control bar */}
          <div className="flex items-center justify-center px-4 py-3 border-t border-[var(--dv-border-subtle)]">
            <AgentControlBar
              variant="default"
              isConnected={session.isConnected}
              onDisconnect={handleDisconnect}
              controls={{
                microphone: true,
                camera: false,
                screenShare: false,
                chat: false,
                leave: true,
              }}
            />
          </div>
        </div>

        {/* Panel resizer - desktop only */}
        <PanelResizer onResize={handleResize} className="hidden lg:flex" />

        {/* Document panel - desktop */}
        <div
          className="hidden lg:flex min-w-0 overflow-hidden"
          style={{
            flex: `0 0 ${docPanelWidth}%`,
            maxWidth: `${docPanelWidth}%`,
          }}
        >
          <DocumentPanel
            documents={documents}
            extractedFields={extractedFields}
            findings={findings}
            workspaceId={workspace.id}
            className="w-full"
          />
        </div>

        {/* Document panel - mobile: Sheet */}
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

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>();
  const store = useVoiceStore();

  return (
    <LiveKitSession
      workspaceId={params.workspaceId}
      autoStart={false}
      onConnectionError={(error) => store.setError(error)}
    >
      <WorkspaceContent workspaceId={params.workspaceId} />
    </LiveKitSession>
  );
}
