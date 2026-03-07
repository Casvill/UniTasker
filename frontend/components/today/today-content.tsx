"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
import { TodayBoard, type Subtask, type SubtaskStatus } from "@/components/today/today-board"
import { TodayFilters } from "@/components/today/today-filters"

type ActividadApi = {
    id: number
    titulo: string
    descripcion: string
    tipo: string
    curso: string
    fecha_entrega: string
    creada_en: string
    usuario: number
}

type TareaApi = {
    id: number
    nombre: string
    fecha_objetivo: string
    horas_estimadas: string | number | null
    actividad: string | number
    estado?: "pendiente" | "finalizado"
}

type LoadState = "loading" | "error" | "success"

const UPCOMING_DAYS = 7

function parseEffort(value: string | number | null | undefined): number | null {
    if (value == null) return null
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
}

function getTodayString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function addDays(dateString: string, days: number) {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    date.setDate(date.getDate() + days)

    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

function compareByRule(a: Subtask, b: Subtask) {
    if (a.target_date !== b.target_date) {
        return a.target_date.localeCompare(b.target_date)
    }

    const aEffort = a.estimated_effort ?? Number.POSITIVE_INFINITY
    const bEffort = b.estimated_effort ?? Number.POSITIVE_INFINITY

    return aEffort - bEffort
}

function isActividadArray(data: unknown): data is ActividadApi[] {
    return Array.isArray(data)
}

function isTareaArray(data: unknown): data is TareaApi[] {
    return Array.isArray(data)
}

export function TodayContent() {
    const [state, setState] = useState<LoadState>("loading")
    const [subtasks, setSubtasks] = useState<Subtask[]>([])
    const [query, setQuery] = useState("")
    const [courseFilter, setCourseFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("pendiente")

    const fetchTodayData = useCallback(async () => {
        try {
            setState("loading")

            const actividadesResponse = await apiFetch("/actividades/")
            const actividadesList: ActividadApi[] = isActividadArray(actividadesResponse)
                ? actividadesResponse
                : []

            const subtasksNested = await Promise.all(
                actividadesList.map(async (actividad) => {
                    const tareasResponse = await apiFetch(`/tareas/?actividad=${actividad.id}`)
                    const tareasList: TareaApi[] = isTareaArray(tareasResponse) ? tareasResponse : []

                    return tareasList
                        .map((tarea): Subtask | null => {
                            if (!tarea.fecha_objetivo) return null

                            const actividadTitle =
                                typeof tarea.actividad === "string" && Number.isNaN(Number(tarea.actividad))
                                    ? tarea.actividad
                                    : actividad.titulo || "Actividad sin título"

                            return {
                                id: tarea.id,
                                title: tarea.nombre || "Subtarea sin título",
                                target_date: tarea.fecha_objetivo,
                                estimated_effort: parseEffort(tarea.horas_estimadas),
                                actividad_title: actividadTitle,
                                course: actividad.curso || "Sin curso",
                                type: actividad.tipo || "Sin tipo",
                                status: (tarea.estado ?? "pendiente") as SubtaskStatus,
                            }
                        })
                        .filter((item): item is Subtask => item !== null)
                })
            )

            setSubtasks(subtasksNested.flat())
            setState("success")
        } catch (error) {
            console.error("Error cargando vista Hoy:", error)
            setState("error")
        }
    }, [])

    useEffect(() => {
        fetchTodayData()
    }, [fetchTodayData])

    const availableCourses = useMemo(() => {
        return Array.from(new Set(subtasks.map((task) => task.course).filter(Boolean))).sort()
    }, [subtasks])

    const filteredSubtasks = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()

        return subtasks.filter((task) => {
            const matchesCourse =
                courseFilter === "all" || task.course === courseFilter

            const matchesStatus =
                statusFilter === "all" || task.status === statusFilter

            const matchesQuery =
                normalizedQuery.length === 0 ||
                task.title.toLowerCase().includes(normalizedQuery) ||
                task.actividad_title.toLowerCase().includes(normalizedQuery) ||
                task.course.toLowerCase().includes(normalizedQuery)

            return matchesCourse && matchesStatus && matchesQuery
        })
    }, [subtasks, courseFilter, statusFilter, query])

    const { overdue, today, upcoming } = useMemo(() => {
        const todayString = getTodayString()
        const upcomingLimit = addDays(todayString, UPCOMING_DAYS)

        const overdue = filteredSubtasks
            .filter((subtask) => subtask.target_date < todayString)
            .sort(compareByRule)

        const today = filteredSubtasks
            .filter((subtask) => subtask.target_date === todayString)
            .sort(compareByRule)

        const upcoming = filteredSubtasks
            .filter(
                (subtask) =>
                    subtask.target_date > todayString &&
                    subtask.target_date <= upcomingLimit
            )
            .sort(compareByRule)

        return { overdue, today, upcoming }
    }, [filteredSubtasks])

    const isEmpty =
        state === "success" &&
        overdue.length === 0 &&
        today.length === 0 &&
        upcoming.length === 0

    if (state === "loading") {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (state === "error") {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
                <p className="max-w-md text-sm text-muted-foreground">
                    No pudimos cargar las tareas de la vista de hoy. Intenta nuevamente.
                </p>
                <Button onClick={fetchTodayData}>Reintentar</Button>
            </div>
        )
    }

    if (isEmpty) {
        return (
            <div className="space-y-6">
                <TodayFilters
                    query={query}
                    courseFilter={courseFilter}
                    statusFilter={statusFilter}
                    availableCourses={availableCourses}
                    onQueryChange={setQuery}
                    onCourseChange={setCourseFilter}
                    onStatusChange={setStatusFilter}
                />

                <div className="flex h-[45vh] flex-col items-center justify-center gap-3 text-center">
                    <p className="max-w-md text-sm text-muted-foreground">
                        Para hoy no tienes tareas programadas. ¿Quieres crear una?
                    </p>

                    <Button asChild>
                        <Link href="/tasks">Crear tareas</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <TodayFilters
                query={query}
                courseFilter={courseFilter}
                statusFilter={statusFilter}
                availableCourses={availableCourses}
                onQueryChange={setQuery}
                onCourseChange={setCourseFilter}
                onStatusChange={setStatusFilter}
            />

            <TodayBoard
                overdue={overdue}
                today={today}
                upcoming={upcoming}
                upcomingDays={UPCOMING_DAYS}
            />
        </div>
    )
}