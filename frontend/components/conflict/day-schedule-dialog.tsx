"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

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
  onBack?: () => void
  onResolved?: () => void
}

export function DayScheduleView({
  date,
  dailyLimit,
  highlightTaskId,
  onBack,
  onResolved,
}: DayScheduleViewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [tasks, setTasks] = useState<DayTaskItem[]>([])
  const [efforts, setEfforts] = useState<Record<number, number>>({})

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

  const totalEffort = useMemo(() => {
    return tasks.reduce((total, item) => {
      const value = efforts[item.id]
      if (typeof value !== "number" || Number.isNaN(value)) return total + item.effort
      return total + value
    }, 0)
  }, [efforts, tasks])

  const canResolve = tasks.length > 0 && totalEffort <= dailyLimit

  const handleResolve = async () => {
    if (!date || !canResolve || isResolving) return

    try {
      setIsResolving(true)
      const updates = tasks.filter((item) => efforts[item.id] !== item.effort)

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
      onResolved?.()
    } catch (error) {
      console.error("Error resolving schedule:", error)
      toast.error("No se pudieron guardar los cambios.")
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-center">Programación del {dateLabel}</DialogTitle>
        <DialogDescription>
          Tú más que nadie conoces tus prioridades, reduce el esfuerzo de las subtareas que consideres necesarias para poder ajustarte a tu tiempo.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Cargando programación...</div>
        ) : (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay subtareas para este día.</div>
            ) : (
              <div className="space-y-3">
                {tasks.map((item) => {
                  const isHighlighted = highlightTaskId === item.id
                  const currentEffort = efforts[item.id]
                  const safeEffort = typeof currentEffort === "number" && !Number.isNaN(currentEffort)
                    ? currentEffort
                    : item.effort

                  return (
                    <div
                      key={item.id}
                      className={`relative rounded-xl border p-3 ${
                        isHighlighted ? "border-amber-400 bg-amber-50/30" : "border-border"
                      }`}
                    >
                      {isHighlighted ? (
                        <span className="absolute -top-2 left-3 bg-background px-2 text-xs font-semibold text-amber-600">
                          Nueva
                        </span>
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.activityName} · {item.courseName}
                          </p>
                          <p className="text-xs text-muted-foreground">Esfuerzo actual: {item.effort}h</p>
                        </div>
                        <div className="min-w-[120px]">
                          <Input
                            type="number"
                            min={0.5}
                            step={0.5}
                            max={item.effort}
                            value={safeEffort}
                            onChange={(e) => {
                              const rawValue = e.target.value
                              const value = rawValue === "" ? item.effort : Number(rawValue)
                              setEfforts((prev) => ({
                                ...prev,
                                [item.id]: value,
                              }))
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
        )}
      </div>

      <div className="rounded-lg border border-dashed border-border p-3 text-sm">
        <div className="flex items-center justify-between">
          <span>Esfuerzo de ese día:</span>
          <span className="font-semibold">{totalEffort}h</span>
        </div>
        <div className={`mt-1 text-xs font-medium ${canResolve ? "text-emerald-600" : "text-destructive"}`}>
          {canResolve ? "No hay conflicto" : "Hay conflicto"}
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
