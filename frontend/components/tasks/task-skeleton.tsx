import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonTasks() {
  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-22 rounded-md" />
        <Skeleton className="h-8 w-29 rounded-md" />
        <Skeleton className="h-8 w-31 rounded-md" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4 h-35 animate-pulse mt-1.5">
          <div className="flex items-start gap-2">
            {/* Checkbox */}
            <Skeleton className="h-5 w-5 mt-1 rounded" />
            <div className="flex-1 space-y-2">
              {/* Header: título y acciones */}
              <div className="flex items-start justify-between gap-8 mb-5">
                <Skeleton className="h-6 w-1/2 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
              {/* Curso y fecha */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              {/* Subtareas */}
              <div className="mt-3.5 mb-0.5 space-y-2 border-t pt-3">
                {[1].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
