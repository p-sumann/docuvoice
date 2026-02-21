import { Skeleton } from "@/components/ui/skeleton";

export function SessionSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-40 bg-[var(--dv-bg-surface)]" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 bg-[var(--dv-bg-surface)] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
