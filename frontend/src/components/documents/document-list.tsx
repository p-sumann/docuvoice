"use client";

import { Plus } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/documents/document-card";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/workspace";

interface DocumentListProps {
  documents: Document[];
  onDocumentClick?: (doc: Document) => void;
  onAddDocument?: () => void;
  className?: string;
}

export function DocumentList({
  documents,
  onDocumentClick,
  onAddDocument,
  className,
}: DocumentListProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-xs font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider">
          Documents ({documents.length})
        </h3>
        {onAddDocument && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-[var(--dv-text-muted)] hover:text-[var(--dv-text-primary)]"
            onClick={onAddDocument}
          >
            <Plus className="size-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-3 pb-3">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isCompact
              onClick={onDocumentClick}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
