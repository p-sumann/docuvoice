import { AudioWaveform } from "lucide-react";

export function Footer() {
  return (
    <footer className="px-6 py-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-[var(--dv-wine)]">
            <AudioWaveform className="size-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--dv-text-primary)]">
            DocuVoice
          </span>
        </div>

        <p className="text-xs text-[var(--dv-text-muted)]">
          &copy; {new Date().getFullYear()} DocuVoice. Open source.
        </p>
      </div>
    </footer>
  );
}
