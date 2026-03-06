"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { TodayBoard } from "@/components/today/today-board"

type Subtask = {
    id: string | number
    title: string
    target_date: string // "YYYY-MM-DD"
    estimated_effort?: number | null
}

type LoadState = "loading" | "error" | "success"

const UPCOMING_DAYS = 7

export function TodayContent() {
    const [state, setState] = useState<LoadState>("loading")
    const [subtasks, setSubtasks] = useState<Subtask[]>([])

    const fetchSubtasks = useCallback(async () => {
        try {
            setState("loading")

            // TODO: reemplazar con tu apiFetch real
            // const data = await apiFetch("/subtareas/")
            // setSubtasks(data)

            setSubtasks([]) // placeholder
            setState("success")
        } catch (e) {
            setState("error")
        }
    }, [])

    useEffect(() => {
        fetchSubtasks()
    }, [fetchSubtasks])

    const { overdue, today, upcoming } = useMemo(() => {
        // TODO: implementar clasificación + orden
        return { overdue: [] as Subtask[], today: [] as Subtask[], upcoming: [] as Subtask[] }
    }, [subtasks])

    const isEmpty = state === "success" && overdue.length === 0 && today.length === 0 && upcoming.length === 0

    if (state === "loading") {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    if (state === "error") {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-3">
                <p className="text-sm text-muted-foreground">
                    No pudimos cargar tus subtareas de hoy. Intenta nuevamente.
                </p>
                <Button onClick={fetchSubtasks}>Reintentar</Button>
            </div>
        )
    }

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-3">
                <p className="text-sm text-muted-foreground">
                    Para hoy no tienes actividades programadas. ¿Quieres crear una?
                </p>
                <Button asChild>
                    <Link href="/tareas">Crear actividad</Link>
                </Button>
            </div>
        )
    }

    return (
        <TodayBoard
            overdue={overdue}
            today={today}
            upcoming={upcoming}
            upcomingDays={UPCOMING_DAYS}
        />
    )
}