"use client";

import { DocumentCard } from "@/components/documents/document-card";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/workspace";

interface DocumentListProps {
  documents: Document[];
  onDocumentClick?: (doc: Document) => void;
  className?: string;
}

export function DocumentList({
  documents,
  onDocumentClick,
  className,
}: DocumentListProps) {
  return (
    <div className={cn("flex flex-col", className)}>
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
    </div>
  );
}
