import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <Skeleton className="h-8 w-48 bg-[var(--dv-bg-surface)]" />
        <Skeleton className="h-4 w-72 mt-2 bg-[var(--dv-bg-surface)]" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 bg-[var(--dv-bg-surface)] rounded-lg" />
        ))}
      </div>

      {/* Workspace cards */}
      <div>
        <Skeleton className="h-4 w-24 mb-4 bg-[var(--dv-bg-surface)]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[120px] bg-[var(--dv-bg-surface)] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
