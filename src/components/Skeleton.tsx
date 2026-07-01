import { cn } from "@/lib/utils"

// ─── Base skeleton pulse ──────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-black/[0.06]",
        className
      )}
    />
  )
}

// ─── MetricCard skeleton ──────────────────────────────────────────────────────
export function MetricCardSkeleton() {
  return (
    <div className="bg-white border border-black/[0.08] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-3 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}

// ─── Dashboard skeleton ───────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="px-4 lg:px-6 py-4 lg:py-6 space-y-6 max-w-[1400px]">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Métricas principales */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Costos */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-black/[0.08]">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-black/[0.06]">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20 ml-auto" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page skeleton genérico ───────────────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <Skeleton className="h-4 w-40" />
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-black/[0.08] rounded-xl p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="w-11 h-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
