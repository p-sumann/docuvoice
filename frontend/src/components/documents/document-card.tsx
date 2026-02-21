"use client";

import { FileText, Check, Loader2, Upload, AlertCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { truncateFilename } from "@/lib/utils";
import type { Document } from "@/types/workspace";

interface DocumentCardProps {
  document: Document;
  isCompact?: boolean;
  onClick?: (doc: Document) => void;
  className?: string;
}

const docTypeLabels: Record<string, string> = {
  fnol: "FNOL",
  policy: "Policy",
  medical_bill: "Medical",
  police_report: "Police Report",
  contract: "Contract",
  nda: "NDA",
  balance_sheet: "Balance Sheet",
  custom: "Document",
};

export function DocumentCard({
  document: doc,
  isCompact = false,
  onClick,
  className,
}: DocumentCardProps) {
  const isReferenced = doc.isReferenced && doc.status === "ready";

  return (
    <Card
      className={cn(
        "bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]",
        "hover:bg-[var(--dv-bg-hover)] transition-all duration-150 cursor-pointer",
        isReferenced && "border-l-2 border-l-[var(--dv-cyan)] shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]",
        doc.status === "processing" && "processing-shimmer",
        className
      )}
      onClick={() => onClick?.(doc)}
    >
      <CardContent className={cn("p-3", isCompact && "p-2")}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md",
              doc.status === "ready" && "bg-emerald-500/10 text-emerald-400",
              doc.status === "processing" && "bg-blue-500/10 text-blue-400",
              doc.status === "uploading" && "bg-amber-500/10 text-amber-400",
              doc.status === "error" && "bg-red-500/10 text-red-400"
            )}
          >
            {doc.status === "ready" && <Check className="size-4" />}
            {doc.status === "processing" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {doc.status === "uploading" && <Upload className="size-4" />}
            {doc.status === "error" && <AlertCircle className="size-4" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="size-3 text-[var(--dv-text-muted)] flex-shrink-0" />
              <span className="text-sm font-medium text-[var(--dv-text-primary)] truncate">
                {isCompact
                  ? truncateFilename(doc.filename, 20)
                  : doc.filename}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-[var(--dv-border-default)]"
              >
                {docTypeLabels[doc.documentType] ?? doc.documentType}
              </Badge>

              {doc.status === "ready" && (
                <span className="text-[10px] text-[var(--dv-text-muted)]">
                  {doc.extractedFields.length} fields
                </span>
              )}

              {isReferenced && (
                <Badge className="text-[10px] h-4 px-1.5 bg-[var(--dv-cyan)]/10 text-[var(--dv-cyan)] border-0">
                  Referenced
                </Badge>
              )}
            </div>

            {/* Upload progress */}
            {doc.status === "uploading" && (
              <Progress
                value={65}
                className="mt-2 h-1 bg-[var(--dv-bg-active)]"
              />
            )}

            {/* Processing indicator */}
            {doc.status === "processing" && (
              <p className="mt-1 text-[10px] text-[var(--dv-text-muted)]">
                Processing with Textract...
              </p>
            )}

            {/* Error */}
            {doc.status === "error" && doc.processingError && (
              <p className="mt-1 text-[10px] text-red-400 truncate">
                {doc.processingError}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
