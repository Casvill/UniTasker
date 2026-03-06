"use client"

import { Calendar, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

type Subtask = {
    id: string | number
    title: string
    target_date: string
    estimated_effort?: number | null
}

type Variant = "overdue" | "today" | "upcoming"

function formatDate(yyyy_mm_dd: string) {
    // Evita el bug de timezone: NO usamos new Date("YYYY-MM-DD")
    // Render simple: YYYY-MM-DD -> DD/MM/YYYY (ajusta si prefieres)
    const [y, m, d] = yyyy_mm_dd.split("-")
    if (!y || !m || !d) return yyyy_mm_dd
    return `${d}/${m}/${y}`
}

export function TodayTaskCard({
    task,
    variant,
}: {
    task: Subtask
    variant: Variant
}) {
    return (
        <article
            className={cn(
                "rounded-xl border bg-background p-3 shadow-sm transition",
                "hover:shadow-md"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium leading-snug">{task.title}</h4>

                {/* mini indicador */}
                <span
                    className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        variant === "overdue" && "bg-destructive/10 text-destructive",
                        variant === "today" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        variant === "upcoming" && "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    )}
                >
                    {variant === "overdue" ? "Vencida" : variant === "today" ? "Hoy" : "Próxima"}
                </span>
            </div>

            <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Fecha: {formatDate(task.target_date)}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Timer className="h-3.5 w-3.5" />
                    <span>
                        Esfuerzo:{" "}
                        {task.estimated_effort == null ? "—" : `${task.estimated_effort}h`}
                    </span>
                </div>
            </div>
        </article>
    )
}