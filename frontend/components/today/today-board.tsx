"use client"

import { TodayColumn } from "@/components/today/today-column"

export type SubtaskStatus = "pendiente" | "finalizado"

export type Subtask = {
    id: number
    title: string
    target_date: string
    estimated_effort: number | null
    actividad_title: string
    course: string
    type: string
    status: SubtaskStatus
}

export function TodayBoard({
    overdue,
    today,
    upcoming,
    upcomingDays,
}: {
    overdue: Subtask[]
    today: Subtask[]
    upcoming: Subtask[]
    upcomingDays: number
}) {
    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <TodayColumn
                title="Vencidas"
                variant="overdue"
                tasks={overdue}
                emptyText="No tienes subtareas vencidas."
            />

            <TodayColumn
                title="Para hoy"
                variant="today"
                tasks={today}
                emptyText="No tienes subtareas para hoy."
            />

            <TodayColumn
                title={`Próximas (${upcomingDays} días)`}
                variant="upcoming"
                tasks={upcoming}
                emptyText="No tienes subtareas próximas."
            />
        </div>
    )
}