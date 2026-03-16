"use client";

import { useRouter } from "next/navigation";

import { WorkspaceWizard } from "@/components/workspace/workspace-wizard";
import { createWorkspace, uploadDocument } from "@/lib/api";
import type { WorkspaceCreatePayload } from "@/types/plugin";

export default function NewWorkspacePage() {
  const router = useRouter();
  const handleComplete = async (payload: WorkspaceCreatePayload) => {
    try {
      const workspace = await createWorkspace(payload.name, payload.domain ?? "auto");

      // Navigate to workspace immediately — preparing UI shows there
      router.push(`/workspace/${workspace.id}?preparing=true`);

      // Upload documents in background (don't await — page already navigated)
      Promise.all(
        payload.documents.map((file) =>
          uploadDocument(workspace.id, file)
        )
      ).catch(() => {});
    } catch {
      // Stay on wizard so user can retry
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <h1 className="text-xl font-bold text-[var(--dv-text-primary)] mb-6">
          Create Workspace
        </h1>
        <WorkspaceWizard
          onComplete={handleComplete}
          onCancel={() => router.push("/dashboard")}
        />
      </div>
    </div>
  );
}
