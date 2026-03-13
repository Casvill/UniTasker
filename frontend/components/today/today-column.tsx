"use client"

import { cn } from "@/lib/utils"
import { TodayTaskCard } from "@/components/today/today-task-card"
import type { Subtask, SubtaskStatus } from "@/components/today/today-board"

type Variant = "overdue" | "today" | "upcoming"

const variantStyles: Record<
    Variant,
    {
        badge: string
        border: string
        bg: string
        accent: string
        header: string
        emptyBox: string
    }
> = {
    overdue: {
        badge: "bg-destructive/10 text-destructive dark:bg-red-500/15 dark:text-red-300",
        border: "border-destructive/20 dark:border-red-500/25",
        bg: "bg-destructive/5 dark:bg-white/[0.02]",
        accent: "text-destructive dark:text-red-400",
        header: "bg-background/80 dark:bg-red-500/[0.04] dark:border-red-500/15",
        emptyBox: "border-destructive/15 bg-destructive/[0.03] dark:border-red-500/20 dark:bg-red-500/[0.05]",
    },
    today: {
        badge: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
        border: "border-amber-500/20 dark:border-amber-400/25",
        bg: "bg-amber-500/5 dark:bg-white/[0.02]",
        accent: "text-amber-700 dark:text-amber-300",
        header: "bg-background/80 dark:bg-amber-400/[0.04] dark:border-amber-400/15",
        emptyBox: "border-amber-500/15 bg-amber-500/[0.03] dark:border-amber-400/20 dark:bg-amber-400/[0.05]",
    },
    upcoming: {
        badge: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
        border: "border-blue-500/20 dark:border-blue-400/25",
        bg: "bg-blue-500/5 dark:bg-white/[0.02]",
        accent: "text-blue-700 dark:text-blue-300",
        header: "bg-background/80 dark:bg-blue-400/[0.04] dark:border-blue-400/15",
        emptyBox: "border-blue-500/15 bg-blue-500/[0.03] dark:border-blue-400/20 dark:bg-blue-400/[0.05]",
    },
}

export function TodayColumn({
    title,
    variant,
    tasks,
    emptyText,
    onToggleSubtask,
    onTaskUpdated,
}: {
    title: string
    variant: Variant
    tasks: Subtask[]
    emptyText: string
    onToggleSubtask: (id: number, currentStatus: SubtaskStatus) => void
    onTaskUpdated: () => Promise<void> | void
}) {
    const styles = variantStyles[variant]

    return (
        <section
            className={cn(
                "rounded-2xl border shadow-sm transition-colors dark:shadow-none",
                styles.border,
                styles.bg,
                "dark:backdrop-blur-sm"
            )}
        >
            <div
                className={cn(
                    "flex items-center justify-between border-b px-5 py-4",
                    styles.header
                )}
            >
                <h3 className={cn("text-lg font-semibold tracking-tight", styles.accent)}>
                    {title}
                </h3>

                <span
                    className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        styles.badge
                    )}
                >
                    {tasks.length}
                </span>
            </div>

            <div className="min-h-[420px] max-h-[72vh] space-y-3 overflow-y-auto p-4">
                {tasks.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center text-center">
                        <div
                            className={cn(
                                "flex min-h-[140px] w-full items-center justify-center rounded-xl border border-dashed px-6",
                                styles.emptyBox
                            )}
                        >
                            <p className="max-w-[220px] text-sm text-muted-foreground dark:text-muted-foreground/90">
                                {emptyText}
                            </p>
                        </div>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TodayTaskCard
                            key={`${variant}-${task.id}-${task.target_date}`}
                            task={task}
                            variant={variant}
                            onToggle={() => onToggleSubtask(task.id, task.status)}
                            onTaskUpdated={onTaskUpdated}
                        />
                    ))
                )}
            </div>
        </section>
    )
}