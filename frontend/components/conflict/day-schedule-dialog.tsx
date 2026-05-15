"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ConflictProvider, useConflicts } from "@/components/conflict/conflict-context"

type DayTaskItem = {
  id: number
  name: string
  activityName: string
  courseName: string
  effort: number
}

type DayScheduleViewProps = {
  date: string
  dailyLimit: number
  highlightTaskId?: number
  pendingTask?: { id: number; name: string; effort: number }
  onBack?: () => void
  onResolved?: () => void
}

export function DayScheduleView({
  date,
  dailyLimit,
  highlightTaskId,
  pendingTask,
  onBack,
  onResolved,
}: DayScheduleViewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [tasks, setTasks] = useState<DayTaskItem[]>([])
  const [efforts, setEfforts] = useState<Record<number, number>>({})
  const { refreshConflicts } = useConflicts()

  const dateLabel = useMemo(() => {
    if (!date) return ""
    const parsed = new Date(date + "T00:00:00")
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString("es", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }, [date])

  useEffect(() => {
    if (!date) {
      setTasks([])
      setEfforts({})
      return
    }

    let isActive = true
    const loadDayDetail = async () => {
      setIsLoading(true)
      try {
        const data = await apiFetch<{ date: string; hasConflict: boolean; items: DayTaskItem[] }>(
          `/tareas/calendario-dia/?date=${date}`
        )
        if (!isActive) return
        setTasks(data.items)
        const initialEfforts = data.items.reduce<Record<number, number>>((acc, item) => {
          acc[item.id] = item.effort
          return acc
        }, {})
        setEfforts(initialEfforts)
      } catch (error) {
        if (!isActive) return
        console.error("Error loading calendar day:", error)
        setTasks([])
        setEfforts({})
        toast.error("No se pudo cargar la programación del día.")
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    loadDayDetail()
    return () => {
      isActive = false
    }
  }, [date])

  // If this is a reprogram conflict the task still has the old date in the DB,
  // so the API won't return it for the new date. Inject it manually so the user
  // can see it highlighted alongside the existing tasks for that day.
  const displayTasks = useMemo(() => {
    if (!pendingTask) return tasks
    const alreadyInList = tasks.some((t) => t.id === pendingTask.id)
    if (alreadyInList) return tasks
    return [
      ...tasks,
      {
        id: pendingTask.id,
        name: pendingTask.name,
        activityName: "",
        courseName: "",
        effort: pendingTask.effort,
      },
    ]
  }, [tasks, pendingTask])

  // Seed the effort for the injected pendingTask so the input is pre-filled
  useEffect(() => {
    if (!pendingTask) return
    setEfforts((prev) => {
      if (pendingTask.id in prev) return prev
      return { ...prev, [pendingTask.id]: pendingTask.effort }
    })
  }, [pendingTask])

  const totalEffort = useMemo(() => {
    return displayTasks.reduce((total, item) => {
      const value = efforts[item.id]
      if (typeof value !== "number" || Number.isNaN(value)) return total + item.effort
      return total + value
    }, 0)
  }, [efforts, displayTasks])

  const canResolve = displayTasks.length > 0 && totalEffort <= dailyLimit

  const handleResolve = async () => {
    if (!date || !canResolve || isResolving) return

    try {
      setIsResolving(true)
      // Only PATCH tasks that exist in the DB with a changed effort.
      // The injected pendingTask is not yet committed to the new date —
      // its reprogramming will be handled by the parent conflict flow.
      const updates = displayTasks.filter(
        (item) => efforts[item.id] !== item.effort && item.id !== pendingTask?.id
      )

      await Promise.all(
        updates.map((item) =>
          apiFetch(`/tareas/${item.id}/`, {
            method: "PATCH",
            body: JSON.stringify({
              horas_estimadas: efforts[item.id] ?? item.effort,
            }),
          })
        )
      )

      toast.success("Programación actualizada.")
      await refreshConflicts()
      onResolved?.()
    } catch (error) {
      console.error("Error resolving schedule:", error)
      toast.error("No se pudieron guardar los cambios.")
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="text-center">Programación del {dateLabel}</DialogTitle>
        <DialogDescription>
          Tú eres quien más conoce tus prioridades, reduce el esfuerzo de las subtareas que consideres necesarias para ajustar tu día.
        </DialogDescription>
      </DialogHeader>

      {/* Lista de subtareas — scrollable para que no cubra toda la pantalla */}
      <div className="max-h-[38vh] overflow-y-auto space-y-2 pr-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2">No hay subtareas para este día.</div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map((item) => {
              const isHighlighted = highlightTaskId === item.id
              const currentEffort = efforts[item.id]
              const safeEffort =
                typeof currentEffort === "number" && !Number.isNaN(currentEffort)
                  ? currentEffort
                  : item.effort
              const hasContext = item.activityName || item.courseName

              return (
                <div
                  key={item.id}
                  className={`relative rounded-xl border p-3 ${
                    isHighlighted ? "border-amber-400" : "border-border"
                  }`}
                >
                  {isHighlighted && (
                    <span className="absolute -top-2 left-3 bg-background px-2 text-xs font-semibold text-amber-600">
                      Nueva
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      {hasContext && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[item.activityName, item.courseName].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Esfuerzo actual: {item.effort}h</p>
                    </div>
                    <div className="min-w-[100px] shrink-0">
                      <Input
                        type="number"
                        min={0.5}
                        step={0.5}
                        max={item.effort}
                        value={safeEffort}
                        onChange={(e) => {
                          const rawValue = e.target.value
                          const value = rawValue === "" ? item.effort : Number(rawValue)
                          setEfforts((prev) => ({ ...prev, [item.id]: value }))
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Resumen del día */}
      <div className="rounded-lg border border-dashed border-border p-3 text-sm space-y-1.5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Esfuerzo del día</span>
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <span className="font-semibold text-foreground">{totalEffort}h</span>
          )}
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Límite diario</span>
          <span className="font-semibold text-foreground">{dailyLimit}h</span>
        </div>
        <div className="border-t border-border pt-1.5">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Calculando...
            </span>
          ) : (
            <span className={`text-xs font-medium ${canResolve ? "text-emerald-600" : "text-destructive"}`}>
              {canResolve ? "✓ Sin conflicto" : "✗ Hay conflicto"}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={handleResolve} disabled={!canResolve || isResolving || isLoading}>
          {isResolving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Solucionar"
          )}
        </Button>
      </div>
    </div>
  )
}

type DayScheduleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
  dailyLimit: number
  highlightTaskId?: number
  onResolved?: () => void
}

export function DayScheduleDialog({
  open,
  onOpenChange,
  date,
  dailyLimit,
  highlightTaskId,
  onResolved,
}: DayScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DayScheduleView
          date={date}
          dailyLimit={dailyLimit}
          highlightTaskId={highlightTaskId}
          onBack={() => onOpenChange(false)}
          onResolved={() => {
            onResolved?.()
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}