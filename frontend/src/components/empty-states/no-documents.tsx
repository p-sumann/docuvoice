import { FileUp } from "lucide-react";

export function NoDocuments() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--dv-bg-active)] mb-3">
        <FileUp className="size-5 text-[var(--dv-text-muted)]" />
      </div>
      <p className="text-xs text-[var(--dv-text-muted)]">
        No documents uploaded
      </p>
      <p className="text-[10px] text-[var(--dv-text-muted)] mt-1">
        Upload documents to start extracting fields
      </p>
    </div>
  );
}
