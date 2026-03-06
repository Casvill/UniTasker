"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, FolderOpen, CalendarDays, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Subtask } from "@/components/today/today-board"

type Variant = "overdue" | "today" | "upcoming"

type ActivityGroup = {
    actividad_id: number
    actividad_title: string
    actividad_course: string
    actividad_type: string
    subtareas: Subtask[]
}

function formatDate(dateString?: string | null) {
    if (!dateString) return "Sin fecha"

    const [year, month, day] = dateString.split("-")
    if (!year || !month || !day) return dateString

    return `${day}/${month}/${year}`
}

export function TodayActivityCard({
    activity,
    variant,
}: {
    activity: ActivityGroup
    variant: Variant
}) {
    const [isOpen, setIsOpen] = useState(true)

    return (
        <article className="overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:shadow-md">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex w-full items-start justify-between gap-3 p-4 text-left"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <h4 className="truncate text-sm font-semibold">
                            {activity.actividad_title || "Actividad sin título"}
                        </h4>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                        {activity.actividad_course || "Sin curso"} · {activity.actividad_type || "Sin tipo"}
                    </p>

                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                        {activity.subtareas.length} subtarea{activity.subtareas.length !== 1 ? "s" : ""}
                    </p>
                </div>

                <div className="shrink-0 pt-1">
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="space-y-3 border-t bg-muted/20 px-4 py-4">
                    {activity.subtareas.map((subtask) => (
                        <div
                            key={`${activity.actividad_id}-${subtask.id}-${subtask.target_date ?? "no-date"}`}
                            className={cn(
                                "rounded-xl border bg-card p-3",
                                variant === "overdue" && "border-destructive/20",
                                variant === "today" && "border-amber-500/20",
                                variant === "upcoming" && "border-blue-500/20"
                            )}
                        >
                            <p className="text-sm font-medium">
                                {subtask.title || "Subtarea sin título"}
                            </p>

                            <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    <span>Fecha: {formatDate(subtask.target_date)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Timer className="h-3.5 w-3.5" />
                                    <span>
                                        Esfuerzo:{" "}
                                        {subtask.estimated_effort == null
                                            ? "No definido"
                                            : `${subtask.estimated_effort}h`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </article>
    )
}