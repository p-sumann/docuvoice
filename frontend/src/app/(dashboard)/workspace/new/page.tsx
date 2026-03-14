"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceWizard } from "@/components/workspace/workspace-wizard";
import { WorkspacePreparing } from "@/components/workspace/workspace-preparing";
import { createWorkspace, uploadDocument } from "@/lib/api";
import type { WorkspaceCreatePayload } from "@/types/plugin";

interface CreatedWorkspace {
  id: string;
  name: string;
}

export default function NewWorkspacePage() {
  const router = useRouter();
  const [created, setCreated] = useState<CreatedWorkspace | null>(null);

  const handleComplete = async (payload: WorkspaceCreatePayload) => {
    try {
      const workspace = await createWorkspace(payload.name, payload.domain ?? "auto");

      await Promise.all(
        payload.documents.map((file) =>
          uploadDocument(workspace.id, file)
        )
      );

      setCreated({ id: workspace.id, name: payload.name });
    } catch {
      // Stay on wizard so user can retry
    }
  };

  if (created) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <WorkspacePreparing
          workspaceId={created.id}
          workspaceName={created.name}
        />
      </div>
    );
  }

  return (
    <div className="page-enter h-full overflow-auto max-w-3xl mx-auto p-6 lg:p-8">
      <h1 className="text-xl font-bold text-[var(--dv-text-primary)] mb-6">
        Create Workspace
      </h1>
      <WorkspaceWizard
        onComplete={handleComplete}
        onCancel={() => router.push("/dashboard")}
      />
    </div>
  );
}
