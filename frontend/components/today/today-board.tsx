"use client"

import { TodayColumn } from "@/components/today/today-column"

export type SubtaskStatus = "pendiente" | "finalizado" | "pospuesta"

export type Subtask = {
    id: number
    title: string
    target_date: string
    estimated_effort: number | null
    actividad_title: string
    course: string
    type: string
    status: SubtaskStatus
    nota?: string
}

export function TodayBoard({
    overdue,
    today,
    upcoming,
    upcomingDays,
    onToggleSubtask,
    onTaskUpdated,
    onTaskUpdateStart,
    onTaskUpdateEnd,
    pendingTaskIds,
}: {
    overdue: Subtask[]
    today: Subtask[]
    upcoming: Subtask[]
    upcomingDays: number
    onToggleSubtask: (id: number, currentStatus: SubtaskStatus) => void
    onTaskUpdated: (options?: { silent?: boolean }) => Promise<void> | void
    onTaskUpdateStart: (taskId: number) => void
    onTaskUpdateEnd: (taskId: number) => void
    pendingTaskIds: number[]
}) {
    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <TodayColumn
                title="Vencidas"
                variant="overdue"
                tasks={overdue}
                emptyText="No tienes subtareas vencidas."
                onToggleSubtask={onToggleSubtask}
                onTaskUpdated={onTaskUpdated}
                onTaskUpdateStart={onTaskUpdateStart}
                onTaskUpdateEnd={onTaskUpdateEnd}
                pendingTaskIds={pendingTaskIds}
            />

            <TodayColumn
                title="Para hoy"
                variant="today"
                tasks={today}
                emptyText="No tienes subtareas para hoy."
                onToggleSubtask={onToggleSubtask}
                onTaskUpdated={onTaskUpdated}
                onTaskUpdateStart={onTaskUpdateStart}
                onTaskUpdateEnd={onTaskUpdateEnd}
                pendingTaskIds={pendingTaskIds}
            />

            <TodayColumn
                title={`Próximas (${upcomingDays} días)`}
                variant="upcoming"
                tasks={upcoming}
                emptyText="No tienes subtareas próximas."
                onToggleSubtask={onToggleSubtask}
                onTaskUpdated={onTaskUpdated}
                onTaskUpdateStart={onTaskUpdateStart}
                onTaskUpdateEnd={onTaskUpdateEnd}
                pendingTaskIds={pendingTaskIds}
            />
        </div>
    )
}