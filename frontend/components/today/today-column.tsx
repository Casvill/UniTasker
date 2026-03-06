"use client"

import { TodayTaskCard } from "@/components/today/today-task-card"
import { cn } from "@/lib/utils"

type Subtask = {
    id: string | number
    title: string
    target_date: string
    estimated_effort?: number | null
}

type Variant = "overdue" | "today" | "upcoming"

const variantStyles: Record<Variant, { badge: string; border: string }> = {
    overdue: {
        badge: "bg-destructive/10 text-destructive",
        border: "border-destructive/20",
    },
    today: {
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        border: "border-amber-500/20",
    },
    upcoming: {
        badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        border: "border-blue-500/20",
    },
}

export function TodayColumn({
    title,
    variant,
    tasks,
    emptyText,
}: {
    title: string
    variant: Variant
    tasks: Subtask[]
    emptyText: string
}) {
    const styles = variantStyles[variant]

    return (
        <section className={cn("rounded-2xl border bg-card shadow-sm", styles.border)}>
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">{title}</h3>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles.badge)}>
                    {tasks.length}
                </span>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
                {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{emptyText}</p>
                ) : (
                    tasks.map((t) => <TodayTaskCard key={t.id} task={t} variant={variant} />)
                )}
            </div>
        </section>
    )
}