import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Center panel */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <Skeleton className="w-28 h-28 rounded-full bg-[var(--dv-bg-surface)]" />
        <Skeleton className="w-32 h-4 bg-[var(--dv-bg-surface)]" />
        <div className="w-full max-w-md space-y-3 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-7 h-7 rounded-full bg-[var(--dv-bg-surface)] flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-16 bg-[var(--dv-bg-surface)]" />
                <Skeleton className="h-4 w-full bg-[var(--dv-bg-surface)]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden lg:flex flex-col w-[35%] border-l border-[var(--dv-border-subtle)] p-4 gap-3">
        <Skeleton className="h-4 w-24 bg-[var(--dv-bg-surface)]" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 bg-[var(--dv-bg-surface)] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
