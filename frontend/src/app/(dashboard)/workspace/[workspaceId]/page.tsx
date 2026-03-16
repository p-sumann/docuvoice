"use client";

import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
import { AudioWaveform, Loader2, PanelRightOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AgentSessionView_01 } from "@/components/agents-ui/blocks/agent-session-view-01/components/agent-session-block";
import { WorkspaceTopBar } from "@/components/workspace/workspace-top-bar";
import { DocumentPanel } from "@/components/workspace/document-panel";
import { WorkspacePreparing } from "@/components/workspace/workspace-preparing";
import { PanelResizer } from "@/components/layout/panel-resizer";
import { LiveKitSession, useLiveKitSessionActions } from "@/components/voice/livekit-session";
import { useWorkspace } from "@/hooks/use-workspace";
import { useVoiceStore } from "@/stores/voice-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

function WorkspaceContent({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { workspace, documents, findings, extractedFields, isLoading } =
    useWorkspace(workspaceId);
  const store = useVoiceStore();
  const { isConnected, phase } = useLiveKitSessionActions();

  const [docPanelWidth, setDocPanelWidth] = useState(40);

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
          <div className="flex items-center justify-center size-16 rounded-2xl bg-[var(--dv-wine)]/10">
            <AudioWaveform className="size-7 text-[var(--dv-wine)] animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="size-3.5 text-[var(--dv-text-muted)] animate-spin" />
            <span className="text-sm text-[var(--dv-text-muted)]">Loading workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show preparation progress when workspace is still being set up
  if (workspace.status === "setup") {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center p-6">
        <WorkspacePreparing
          workspaceId={workspace.id}
          workspaceName={workspace.name}
        />
      </div>
    );
  }

  // Hide document panel when showing the post-session report card
  const showDocPanel = phase !== "ended";

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
      <WorkspaceTopBar
        workspace={workspace}
        isSessionActive={isConnected}
        sessionDuration={store.sessionDuration}
        onEndSession={() => store.resetSession()}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Center: Official LiveKit Agent Session View */}
        <div className="flex flex-col flex-1 min-w-0">
          <AgentSessionView_01
            audioVisualizerType="aura"
            className="flex-1"
          />
        </div>

        {showDocPanel && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>();
  const store = useVoiceStore();

  // Read workspace name/domain from the store — populated by WorkspaceContent's useWorkspace call.
  // No duplicate fetch here — just subscribing to what's already in the store.
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const workspaceName = activeWorkspace?.id === params.workspaceId ? activeWorkspace.name : undefined;
  const workspaceDomain = activeWorkspace?.id === params.workspaceId ? activeWorkspace.domain : undefined;

  return (
    <LiveKitSession
      workspaceId={params.workspaceId}
      workspaceName={workspaceName}
      domain={workspaceDomain}
      onConnectionError={(error) => store.setError(error)}
    >
      <WorkspaceContent workspaceId={params.workspaceId} />
    </LiveKitSession>
  );
}
