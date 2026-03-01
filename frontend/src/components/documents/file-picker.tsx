"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilePickerProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  className?: string;
}

export function FilePicker({ files, onFilesChange, className }: FilePickerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const arr = Array.from(newFiles);
      // Deduplicate by name
      const existing = new Set(files.map((f) => f.name));
      const unique = arr.filter((f) => !existing.has(f.name));
      onFilesChange([...files, ...unique]);
    },
    [files, onFilesChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
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
        <Upload className="size-8 text-[var(--dv-text-muted)]" />
        <div className="text-center">
          <p className="text-sm text-[var(--dv-text-primary)]">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-[var(--dv-text-muted)] mt-1">
            PDF, DOCX, TXT, PNG, JPG
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dv-bg-surface)] border border-[var(--dv-border-subtle)]"
            >
              <FileText className="size-4 text-[var(--dv-text-muted)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--dv-text-primary)] truncate">
                  {file.name}
                </p>
                <p className="text-xs text-[var(--dv-text-muted)]">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-[var(--dv-text-muted)] hover:text-red-400"
                onClick={() => removeFile(index)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
