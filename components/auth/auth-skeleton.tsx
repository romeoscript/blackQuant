import { Skeleton } from "@/components/ui/skeleton";

/**
 * Stand-in for an auth form while its route segment streams in. Mirrors the
 * column width and vertical rhythm of AuthShell's <main> so the real form drops
 * straight in without shifting.
 */
export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-14 lg:px-16 lg:py-10">
      <div className="w-full max-w-[400px] animate-in fade-in duration-300">
        <Skeleton className="h-7 w-48 bg-bq-surface" />
        <Skeleton className="mt-2.5 h-4 w-64 bg-bq-surface/60" />

        <div className="mt-7 flex flex-col gap-4">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-28 bg-bq-surface/60" />
              <Skeleton className="mt-2 h-11 w-full rounded-xl bg-bq-surface/40" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-7 h-11 w-full rounded-xl bg-bq-surface" />
        <Skeleton className="mx-auto mt-7 h-3 w-40 bg-bq-surface/40" />
        <Skeleton className="mt-7 h-11 w-full rounded-xl bg-bq-surface/40" />
      </div>
    </div>
  );
}
