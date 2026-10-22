import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function SplitSkeleton() {
  return (
    <div className="flex h-[32rem] overflow-hidden rounded-xl border border-border">
      <div className="w-[380px] space-y-2 border-r border-border p-4">
        <ListSkeleton />
      </div>
      <div className="flex-1 space-y-3 p-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function Skeletons() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton />
      <SplitSkeleton />
    </div>
  );
}
