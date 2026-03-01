"use client";

import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
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

  const anomalyCount = extractedFields.filter((f) => f.isAnomaly).length;
  const criticalCount = findings.filter(
    (f) => f.severity === "critical" || f.severity === "high"
  ).length;

  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden",
        "border-l border-[var(--dv-border-subtle)]",
        "bg-[var(--dv-bg-base)]",
        className
      )}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {/* Documents section */}
        <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider hover:bg-[var(--dv-bg-hover)] transition-colors">
            <span>Documents ({documents.length})</span>
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
            <span>Extracted Fields ({extractedFields.length})</span>
            <div className="flex items-center gap-2">
              {anomalyCount > 0 && (
                <span className="text-[10px] text-[var(--dv-amber)] normal-case tracking-normal font-normal">
                  {anomalyCount} anomal{anomalyCount === 1 ? "y" : "ies"}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "size-3 transition-transform",
                  fieldsOpen && "rotate-180"
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ExtractedFieldsList fields={extractedFields} />
          </CollapsibleContent>
        </Collapsible>

        {/* Findings section */}
        <Collapsible open={findingsOpen} onOpenChange={setFindingsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-[var(--dv-text-secondary)] uppercase tracking-wider hover:bg-[var(--dv-bg-hover)] transition-colors border-t border-[var(--dv-border-subtle)]">
            <span>Findings ({findings.length})</span>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                  {criticalCount} critical
                </Badge>
              )}
              <ChevronDown
                className={cn(
                  "size-3 transition-transform",
                  findingsOpen && "rotate-180"
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <FindingList findings={findings} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
