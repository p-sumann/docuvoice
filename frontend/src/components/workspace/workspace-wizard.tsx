"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePicker } from "@/components/documents/file-picker";
import { cn } from "@/lib/utils";
import type { WorkspaceCreatePayload } from "@/types/plugin";

interface WorkspaceWizardProps {
  onComplete: (payload: WorkspaceCreatePayload) => void;
  onCancel: () => void;
  className?: string;
}

function deriveWorkspaceName(files: File[]): string {
  if (files.length === 0) return "";
  const first = files[0].name.replace(/\.[^.]+$/, "");
  if (files.length === 1) return first;
  return `${first} +${files.length - 1} more`;
}

export function WorkspaceWizard({
  onComplete,
  onCancel,
  className,
}: WorkspaceWizardProps) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [nameManuallySet, setNameManuallySet] = useState(false);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    if (!nameManuallySet) {
      setWorkspaceName(deriveWorkspaceName(newFiles));
    }
  };

  const handleNameChange = (value: string) => {
    setWorkspaceName(value);
    setNameManuallySet(value.length > 0);
  };

  const canSubmit = files.length > 0;

  const handleSubmit = () => {
    onComplete({
      name: workspaceName.trim() || deriveWorkspaceName(files),
      documents: files,
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Drop zone — prominent */}
      <FilePicker files={files} onFilesChange={handleFilesChange} />

      {/* Optional workspace name */}
      <div className="space-y-2">
        <Label
          htmlFor="workspace-name"
          className="text-sm text-[var(--dv-text-secondary)]"
        >
          Workspace Name{" "}
          <span className="text-[var(--dv-text-muted)]">(optional)</span>
        </Label>
        <Input
          id="workspace-name"
          placeholder="Auto-generated from file names"
          value={workspaceName}
          onChange={(e) => handleNameChange(e.target.value)}
          className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-default)] text-[var(--dv-text-primary)]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-[var(--dv-text-secondary)]"
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-[var(--dv-wine)] hover:bg-[var(--dv-wine)]/90 text-white px-6"
        >
          <Sparkles className="size-4 mr-2" />
          Analyze
        </Button>
      </div>
    </div>
  );
}
