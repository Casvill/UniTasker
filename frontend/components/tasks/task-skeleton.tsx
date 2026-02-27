import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonTasks() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-5 w-5 mt-1 rounded" />
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="mt-3 space-y-2 border-t pt-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
