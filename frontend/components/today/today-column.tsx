"use client"

import { cn } from "@/lib/utils"
import { TodayTaskCard } from "@/components/today/today-task-card"
import type { Subtask } from "@/components/today/today-board"

type Variant = "overdue" | "today" | "upcoming"

const variantStyles: Record<Variant, { badge: string; border: string; bg: string; accent: string }> = {
    overdue: {
        badge: "bg-destructive/10 text-destructive",
        border: "border-destructive/20",
        bg: "bg-destructive/5",
        accent: "text-destructive",
    },
    today: {
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        border: "border-amber-500/20",
        bg: "bg-amber-500/5",
        accent: "text-amber-700 dark:text-amber-400",
    },
    upcoming: {
        badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        border: "border-blue-500/20",
        bg: "bg-blue-500/5",
        accent: "text-blue-700 dark:text-blue-400",
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
        <section className={cn("rounded-2xl border shadow-sm", styles.border, styles.bg)}>
            <div className="flex items-center justify-between border-b bg-background/80 px-5 py-4">
                <h3 className={cn("text-lg font-semibold tracking-tight", styles.accent)}>
                    {title}
                </h3>

                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", styles.badge)}>
                    {tasks.length}
                </span>
            </div>

            <div className="min-h-[420px] max-h-[72vh] space-y-3 overflow-y-auto p-4">
                {tasks.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center text-center">
                        <p className="max-w-[220px] text-sm text-muted-foreground">{emptyText}</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TodayTaskCard
                            key={`${variant}-${task.id}-${task.target_date}`}
                            task={task}
                            variant={variant}
                        />
                    ))
                )}
            </div>
        </section>
    )
}