"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AudioWaveform } from "lucide-react";

import { WorkspaceWizard } from "@/components/workspace/workspace-wizard";
import { WorkspacePreparing } from "@/components/workspace/workspace-preparing";
import { createWorkspace, uploadDocument } from "@/lib/api";
import type { WorkspaceCreatePayload } from "@/types/plugin";

interface CreatedWorkspace {
  id: string;
  name: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [created, setCreated] = useState<CreatedWorkspace | null>(null);

  const handleComplete = async (payload: WorkspaceCreatePayload) => {
    try {
      const workspace = await createWorkspace(
        payload.name,
        payload.domain ?? "auto"
      );

      await Promise.all(
        payload.documents.map((file) => uploadDocument(workspace.id, file))
      );

      setCreated({ id: workspace.id, name: payload.name });
    } catch {
      // Stay on wizard so user can retry
    }
  };

  if (created) {
    return (
      <div className="w-full max-w-2xl py-12">
        <WorkspacePreparing
          workspaceId={created.id}
          workspaceName={created.name}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="flex items-center justify-center size-14 rounded-2xl bg-[var(--dv-wine)]">
          <AudioWaveform className="size-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--dv-text-primary)]">
          Welcome to DocuVoice
        </h1>
        <p className="text-sm text-[var(--dv-text-secondary)] max-w-md">
          Drop your documents and start analyzing with AI-powered voice
          conversations.
        </p>
      </div>

      <WorkspaceWizard
        onComplete={handleComplete}
        onCancel={() => router.push("/")}
      />
    </div>
  );
}
