"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import Link from "next/link"
import { Loader2, Info, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { TodayBoard, type Subtask, type SubtaskStatus } from "@/components/today/today-board"
import { TodayFilters } from "@/components/today/today-filters"

type TareaBackend = {
    id: number
    nombre: string
    fecha_objetivo: string
    horas_estimadas: string | number | null
    estado: "pendiente" | "hecha" | "pospuesta"
    actividad: string
    curso: string
    tipo?: string
}

type TodayApiResponse = {
    vencidas: TareaBackend[]
    para_hoy: TareaBackend[]
    proximas: TareaBackend[]
    total: number
    mensaje: string | null
}

type LoadState = "loading" | "error" | "success"

const UPCOMING_DAYS = 7

function parseEffort(value: string | number | null | undefined): number | null {
    if (value == null) return null
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
}

export function TodayContent() {
    const [state, setState] = useState<LoadState>("loading")
    const [data, setData] = useState<TodayApiResponse>({
        vencidas: [],
        para_hoy: [],
        proximas: [],
        total: 0,
        mensaje: null
    })
    const [allCourses, setAllCourses] = useState<string[]>([])
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [courseFilter, setCourseFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    
    const isFirstLoad = useRef(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    const mapBackendToSubtask = useCallback((tarea: TareaBackend): Subtask => ({
        id: tarea.id,
        title: tarea.nombre || "Subtarea sin título",
        target_date: tarea.fecha_objetivo,
        estimated_effort: parseEffort(tarea.horas_estimadas),
        actividad_title: tarea.actividad || "Actividad sin título",
        course: tarea.curso || "Sin curso",
        type: tarea.tipo || "Sin tipo",
        status: (tarea.estado === "hecha" ? "finalizado" : "pendiente") as SubtaskStatus,
    }), []);

    const fetchCourses = useCallback(async () => {
        try {
            const activities: any = await apiFetch("/actividades/")
            const activitiesList = Array.isArray(activities) ? activities : (activities?.results || [])
            const courses = Array.from(new Set(activitiesList.map((a: any) => a.curso).filter(Boolean))).sort() as string[]
            setAllCourses(courses)
        } catch (e) {
            console.error("Error fetching courses:", e)
        }
    }, [])

    const handleToggleSubtask = useCallback(async (id: number, currentStatus: SubtaskStatus) => {
        try {
            const isHecha = currentStatus === "finalizado";
            const newStatus = isHecha ? "pendiente" : "hecha";
            
            toast.loading(isHecha ? "Actualizando..." : "Completando...");
            
            await apiFetch(`/tareas/${id}/`, {
                method: "PATCH",
                body: JSON.stringify({ estado: newStatus })
            });

            setData(prev => ({
                ...prev,
                vencidas: prev.vencidas.map(s => s.id === id ? { ...s, estado: newStatus } : s),
                para_hoy: prev.para_hoy.map(s => s.id === id ? { ...s, estado: newStatus } : s),
                proximas: prev.proximas.map(s => s.id === id ? { ...s, estado: newStatus } : s),
            }));

            toast.dismiss();
            toast.success(isHecha ? "Tarea marcada como pendiente" : "Tarea completada");
        } catch (error) {
            toast.dismiss();
            toast.error("Error al actualizar la tarea");
        }
    }, []);

    const fetchTodayData = useCallback(async (silent = false) => {
        try {
            if (!silent) setState("loading")

            const params = new URLSearchParams()
            if (courseFilter !== "all") params.append("curso", courseFilter)
            if (statusFilter !== "all") params.append("estado", statusFilter)
            // Note: search is filtered on frontend as backend doesn't support it for 'hoy' endpoint

            const response = await apiFetch<TodayApiResponse>(`/tareas/hoy/?${params.toString()}`)
            setData(response)
            setState("success")
            isFirstLoad.current = false
        } catch (error) {
            console.error("Error cargando vista Hoy:", error)
            setState("error")
        }
    }, [courseFilter, statusFilter])

    useEffect(() => {
        fetchCourses()
    }, [fetchCourses])

    useEffect(() => {
        fetchTodayData(state === "success")
    }, [fetchTodayData])

    // Client-side search filtering
    const displayData = useMemo(() => {
        const q = debouncedQuery.toLowerCase().trim()
        if (!q) return {
            vencidas: data.vencidas.map(mapBackendToSubtask),
            para_hoy: data.para_hoy.map(mapBackendToSubtask),
            proximas: data.proximas.map(mapBackendToSubtask)
        }

        const filterFn = (t: TareaBackend) => 
            t.nombre.toLowerCase().includes(q) || 
            t.actividad.toLowerCase().includes(q) ||
            t.curso.toLowerCase().includes(q)

        return {
            vencidas: data.vencidas.filter(filterFn).map(mapBackendToSubtask),
            para_hoy: data.para_hoy.filter(filterFn).map(mapBackendToSubtask),
            proximas: data.proximas.filter(filterFn).map(mapBackendToSubtask)
        }
    }, [data, debouncedQuery, mapBackendToSubtask])

    const hasActiveFilters = query !== "" || courseFilter !== "all" || statusFilter !== "all"
    const handleClearFilters = () => {
        setQuery("")
        setCourseFilter("all")
        setStatusFilter("all")
    }

    const isEmpty =
        state === "success" &&
        displayData.vencidas.length === 0 &&
        displayData.para_hoy.length === 0 &&
        displayData.proximas.length === 0

    if (state === "loading" && isFirstLoad.current) {
        return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    if (state === "error") {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
                <p className="max-w-md text-sm text-muted-foreground">No pudimos cargar las tareas de la vista de hoy.</p>
                <Button onClick={() => fetchTodayData()}>Reintentar</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {data.mensaje && !hasActiveFilters && (
                <Alert variant="default" className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle>Información</AlertTitle>
                    <AlertDescription>{data.mensaje}</AlertDescription>
                </Alert>
            )}

            <TodayFilters
                query={query}
                courseFilter={courseFilter}
                statusFilter={statusFilter}
                availableCourses={allCourses}
                onQueryChange={setQuery}
                onCourseChange={setCourseFilter}
                onStatusChange={setStatusFilter}
            />

            {isEmpty ? (
                <div className="flex h-[45vh] flex-col items-center justify-center gap-3 text-center">
                    <div className="rounded-full bg-muted/30 p-4 mb-2"><Search className="h-8 w-8 text-muted-foreground opacity-20" /></div>
                    <p className="max-w-[320px] text-base font-medium text-foreground">{hasActiveFilters ? "No encontramos resultados" : "No tienes tareas programadas"}</p>
                    <div className="flex gap-3 mt-2">
                        {hasActiveFilters && <Button onClick={handleClearFilters}>Limpiar filtros</Button>}
                        <Button asChild variant={hasActiveFilters ? "outline" : "default"}><Link href="/tasks">Ir a Actividades</Link></Button>
                    </div>
                </div>
            ) : (
                <div className={state === "loading" ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                    <TodayBoard
                        overdue={displayData.vencidas}
                        today={displayData.para_hoy}
                        upcoming={displayData.proximas}
                        upcomingDays={UPCOMING_DAYS}
                        onToggleSubtask={handleToggleSubtask}
                    />
                </div>
            )}
        </div>
    )
}
