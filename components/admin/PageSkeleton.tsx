import { Skeleton } from '@/components/ui/skeleton'

export default function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-admin-border" />
          <Skeleton className="h-4 w-72 bg-admin-border" />
        </div>
        <Skeleton className="h-10 w-32 bg-admin-border" />
      </div>
      <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-admin-border" />
          ))}
        </div>
      </div>
    </div>
  )
}
