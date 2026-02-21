import Link from "next/link";
import { FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NoWorkspaces() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--dv-bg-active)] mb-4">
        <FolderPlus className="size-7 text-[var(--dv-text-muted)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--dv-text-primary)] mb-1">
        No workspaces yet
      </h3>
      <p className="text-xs text-[var(--dv-text-muted)] max-w-sm mb-4">
        Create your first workspace to start analyzing documents with voice.
      </p>
      <Button asChild className="bg-[var(--dv-wine)] hover:bg-[var(--dv-wine)]/90 text-white">
        <Link href="/workspace/new">Create Workspace</Link>
      </Button>
    </div>
  );
}
