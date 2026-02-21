import { Search } from "lucide-react";

export function NoFindings() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--dv-bg-active)] mb-3">
        <Search className="size-5 text-[var(--dv-text-muted)]" />
      </div>
      <p className="text-xs text-[var(--dv-text-muted)]">
        No findings yet
      </p>
      <p className="text-[10px] text-[var(--dv-text-muted)] mt-1">
        Findings will appear as the agent discovers discrepancies
      </p>
    </div>
  );
}
