"use client";

import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUpload } from "@/components/documents/document-upload";
import { ExtractedFieldsList } from "@/components/documents/extracted-fields";
import { FindingList } from "@/components/findings/finding-list";
import { cn } from "@/lib/utils";
import type { Document, ExtractedField } from "@/types/workspace";
import type { Finding } from "@/types/finding";

interface DocumentPanelProps {
  documents: Document[];
  extractedFields: ExtractedField[];
  findings: Finding[];
  workspaceId: string;
  className?: string;
}

export function DocumentPanel({
  documents,
  extractedFields,
  findings,
  workspaceId,
  className,
}: DocumentPanelProps) {
  const [docsOpen, setDocsOpen] = useState(true);
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [findingsOpen, setFindingsOpen] = useState(true);

  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden",
        "border-l border-[var(--dv-border-subtle)]",
        "bg-[var(--dv-bg-base)]",
        className
      )}
    >
      {/* Documents section */}
      <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider hover:bg-[var(--dv-bg-hover)] transition-colors">
          Documents ({documents.length})
          <ChevronDown
            className={cn(
              "size-3 transition-transform",
              docsOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <DocumentList documents={documents} />
          <DocumentUpload workspaceId={workspaceId} />
        </CollapsibleContent>
      </Collapsible>

      {/* Extracted Fields section */}
      <Collapsible open={fieldsOpen} onOpenChange={setFieldsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider hover:bg-[var(--dv-bg-hover)] transition-colors border-t border-[var(--dv-border-subtle)]">
          Extracted Fields ({extractedFields.length})
          <ChevronDown
            className={cn(
              "size-3 transition-transform",
              fieldsOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ExtractedFieldsList fields={extractedFields} />
        </CollapsibleContent>
      </Collapsible>

      {/* Findings section */}
      <Collapsible open={findingsOpen} onOpenChange={setFindingsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider hover:bg-[var(--dv-bg-hover)] transition-colors border-t border-[var(--dv-border-subtle)]">
          Findings ({findings.length})
          <ChevronDown
            className={cn(
              "size-3 transition-transform",
              findingsOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <FindingList findings={findings} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
