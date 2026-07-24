import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while a dashboard route segment streams in. The dashboard shell
 * (sidebar + topbar) is part of the layout and stays mounted, so this only
 * needs to stand in for the page body inside <main>.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* page header */}
      <Skeleton className="h-7 w-52 bg-bq-surface" />
      <Skeleton className="mt-2.5 h-4 w-72 bg-bq-surface/60" />

      {/* stat row */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-bq-border bg-bq-panel p-5"
          >
            <Skeleton className="h-3 w-24 bg-bq-surface/60" />
            <Skeleton className="mt-3 h-7 w-28 bg-bq-surface" />
            <Skeleton className="mt-3 h-3 w-16 bg-bq-surface/40" />
          </div>
        ))}
      </div>

      {/* main panel + side column */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-bq-border bg-bq-panel p-6">
          <Skeleton className="h-4 w-40 bg-bq-surface" />
          <Skeleton className="mt-5 h-[260px] w-full bg-bq-surface/40" />
        </div>
        <div className="rounded-2xl border border-bq-border bg-bq-panel p-6">
          <Skeleton className="h-4 w-32 bg-bq-surface" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-3.5 w-36 bg-bq-surface/60" />
                <Skeleton className="h-3.5 w-14 bg-bq-surface/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
