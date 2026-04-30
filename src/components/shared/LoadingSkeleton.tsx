import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ProductCardSkeleton() {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
      <Skeleton className="aspect-square w-full bg-[var(--bg-elevated)]" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 bg-[var(--bg-elevated)]" />
        <Skeleton className="h-3 w-1/2 bg-[var(--bg-elevated)]" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20 bg-[var(--bg-elevated)]" />
          <Skeleton className="h-8 w-24 bg-[var(--bg-elevated)]" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-4 p-4', className)}>
      <Skeleton className="h-8 w-48 bg-[var(--bg-elevated)]" />
      <Skeleton className="h-4 w-full bg-[var(--bg-elevated)]" />
      <Skeleton className="h-4 w-2/3 bg-[var(--bg-elevated)]" />
    </div>
  )
}
