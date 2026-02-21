"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDocuments } from "@/hooks/use-documents";

interface DocumentUploadProps {
  workspaceId: string;
  onUploadComplete?: () => void;
  className?: string;
}

const ACCEPTED_TYPES = ".pdf,.docx,.txt,.png,.jpg,.jpeg";

export function DocumentUpload({
  workspaceId,
  onUploadComplete,
  className,
}: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { simulateUpload } = useDocuments();

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        simulateUpload(file, workspaceId);
      });
      onUploadComplete?.();
    },
    [simulateUpload, workspaceId, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className={cn("px-3 pb-3", className)}>
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 p-4",
          "border-2 border-dashed rounded-lg cursor-pointer",
          "transition-all duration-150",
          isDragOver
            ? "border-[var(--dv-wine)] bg-[var(--dv-wine)]/5"
            : "border-[var(--dv-border-default)] hover:border-[var(--dv-border-strong)]"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {isDragOver ? (
          <FileUp className="size-5 text-[var(--dv-wine)]" />
        ) : (
          <Upload className="size-5 text-[var(--dv-text-muted)]" />
        )}
        <p className="text-xs text-[var(--dv-text-muted)] text-center">
          {isDragOver ? "Drop files here" : "Drop files or click to upload"}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
