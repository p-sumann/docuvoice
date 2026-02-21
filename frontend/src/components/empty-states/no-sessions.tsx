import { Mic } from "lucide-react";

export function NoSessions() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--dv-bg-active)] mb-3">
        <Mic className="size-5 text-[var(--dv-text-muted)]" />
      </div>
      <p className="text-sm text-[var(--dv-text-muted)]">
        No voice sessions yet
      </p>
      <p className="text-xs text-[var(--dv-text-muted)] mt-1">
        Click the voice orb to start your first session
      </p>
    </div>
  );
}
