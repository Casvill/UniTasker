import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const columnVariants = [
  {
    border: "border-destructive/20 dark:border-red-500/20",
    bg: "bg-destructive/5 dark:bg-white/[0.02]",
    header: "bg-background/80 dark:bg-red-500/[0.04] dark:border-red-500/15",
    badge: "bg-destructive/10 text-destructive dark:bg-red-500/15 dark:text-red-300",
    accent: "text-destructive dark:text-red-400",
  },
  {
    border: "border-amber-500/20 dark:border-amber-400/20",
    bg: "bg-amber-500/5 dark:bg-white/[0.02]",
    header: "bg-background/80 dark:bg-amber-400/[0.04] dark:border-amber-400/15",
    badge: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    accent: "text-amber-700 dark:text-amber-300",
  },
  {
    border: "border-blue-500/20 dark:border-blue-400/20",
    bg: "bg-blue-500/5 dark:bg-white/[0.02]",
    header: "bg-background/80 dark:bg-blue-400/[0.04] dark:border-blue-400/15",
    badge: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
    accent: "text-blue-700 dark:text-blue-300",
  },
]

export function TodayColumnsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {[0, 1, 2].map((col) => (
        <section
          key={col}
          className={cn(
            "rounded-2xl border shadow-sm transition-colors dark:shadow-none flex flex-col",
            columnVariants[col].border,
            columnVariants[col].bg,
            "dark:backdrop-blur-sm"
          )}
        >
          {/* Header columna */}
          <div
            className={cn(
              "flex items-center justify-between border-b px-5 py-4.5",
              columnVariants[col].header
            )}
          >
            <span className={cn("text-lg font-semibold tracking-tight", columnVariants[col].accent)}>
              <Skeleton className="h-6 w-32 rounded" />
            </span>
            <Skeleton className={cn("h-6 w-10 rounded-full", columnVariants[col].badge)} />
          </div>
          {/* Cards  */}
          <div className="min-h-[420px] max-h-[72vh] space-y-3 overflow-y-auto p-4">
            {[1, 2, 3].map((i) => (
              <article
                key={i}
                className={cn(
                  "rounded-2xl border bg-background p-5 shadow-sm transition hover:shadow-md",
                  "dark:bg-white/[0.035] dark:border-white/10 dark:shadow-none dark:hover:bg-white/[0.055]",
                  columnVariants[col].border
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox  */}
                  <Skeleton className="h-5 w-5 mt-1 rounded" />
                  <div className="min-w-0 flex-1 flex flex-col space-y-2">
                    {/* Bloque principal */}
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-3/4 rounded" /> {/* Título */}
                      <Skeleton className="h-4 w-1/2 rounded" /> {/* Actividad */}
                      <Skeleton className="h-3 w-1/4 rounded" /> {/* Curso */}
                    </div>
                    {/* Bloque detalles */}
                    <div className="flex flex-col gap-2 mt-3">
                      <Skeleton className="h-4 w-1/3 rounded" /> {/* Esfuerzo */}
                      <Skeleton className="h-4 w-1/4 rounded" /> {/* Fecha */}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}