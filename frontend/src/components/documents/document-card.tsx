"use client";

import { FileText, Check, Loader2, Upload, AlertCircle } from "lucide-react";

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

function StatusIcon({ status }: { status: Document["status"] }) {
  if (status === "ready") return <Check className="size-3 text-emerald-500" />;
  if (status === "processing")
    return <Loader2 className="size-3 text-blue-400 animate-spin" />;
  if (status === "uploading")
    return <Upload className="size-3 text-amber-400" />;
  if (status === "error")
    return <AlertCircle className="size-3 text-red-400" />;
  return <FileText className="size-3 text-[var(--dv-text-muted)]" />;
}

export function DocumentCard({
  document: doc,
  isCompact = false,
  onClick,
  className,
}: DocumentCardProps) {
  const isReferenced = doc.isReferenced && doc.status === "ready";

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-left",
        "hover:bg-[var(--dv-bg-hover)] transition-colors duration-150",
        isReferenced && "bg-[var(--dv-cyan)]/5",
        doc.status === "processing" && "processing-shimmer",
        className
      )}
      onClick={() => onClick?.(doc)}
    >
      {/* Status icon */}
      <StatusIcon status={doc.status} />

      {/* Filename */}
      <span className="flex-1 min-w-0 text-xs text-[var(--dv-text-primary)] truncate">
        {isCompact ? truncateFilename(doc.filename, 24) : doc.filename}
      </span>

      {/* Type label */}
      <span className="flex-shrink-0 text-[10px] text-[var(--dv-text-muted)]">
        {docTypeLabels[doc.documentType] ?? doc.documentType}
      </span>
    </button>
  );
}
