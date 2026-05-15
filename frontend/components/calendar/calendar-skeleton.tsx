import { Skeleton } from "@/components/ui/skeleton"

export function CalendarGridSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 42 }, (_, index) => (
        <Skeleton key={index} className="aspect-square rounded-lg" />
      ))}
    </div>
  )
}

export function CalendarDayDetailSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="p-3 rounded-lg border border-border">
          <div className="flex items-start gap-3">
            <Skeleton className="w-1 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
