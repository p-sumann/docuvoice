"use client";

import { useRouter } from "next/navigation";

import { WorkspaceWizard } from "@/components/workspace/workspace-wizard";

export default function NewWorkspacePage() {
  const router = useRouter();

  return (
    <div className="page-enter max-w-3xl mx-auto p-6 lg:p-8">
      <h1 className="text-xl font-bold text-[var(--dv-text-primary)] mb-6">
        Create Workspace
      </h1>
      <WorkspaceWizard
        onComplete={() => {
          router.push("/workspace/ws-001");
        }}
        onCancel={() => router.push("/")}
      />
    </div>
  );
}
