"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarClock, CalendarDays, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { OverloadConflictDialog } from "@/components/conflict/overload-conflict-dialog"

type ReprogramTaskPopoverProps = {
    taskId: number
    taskTitle: string
    activityTitle: string
    currentDate: string
    currentEffort: number
    onSaved: () => Promise<void> | void
}

function getTodayString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export function ReprogramTaskPopover({
    taskId,
    taskTitle,
    activityTitle,
    currentDate,
    currentEffort,
    onSaved,
}: ReprogramTaskPopoverProps) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState(currentDate)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const today = useMemo(() => getTodayString(), [])

    const [conflictData, setConflictData] = useState<null | {
        taskId: number
        task: { id: number; title: string; date: string; effort: number }
        day: string
        scheduledHours: number
        dailyLimit: number
        message: string
    }>(null)

    const isDirty = date !== currentDate

    useEffect(() => {
        if (open) {
            setDate(currentDate)
        }
    }, [open, currentDate])

    const handleSaveConflict = async (newDate: string, newEffort: number) => {
        if (!conflictData) return
        try {
            const result = await apiFetch(`/tareas/${conflictData.taskId}/reprogramar/`, {
                method: "PATCH",
                body: JSON.stringify({
                    fecha_objetivo: newDate,
                    horas_estimadas: newEffort,
                }),
            }) as {
                conflict: boolean
                planned_hours: number
                daily_limit: number
                message: string
            }
            if (result.conflict) {
                setConflictData({
                    ...conflictData,
                    task: {
                        ...conflictData.task,
                        id: conflictData.taskId,
                        date: newDate,
                        effort: newEffort,
                    },
                    day: newDate,
                    scheduledHours: result.planned_hours,
                    dailyLimit: result.daily_limit,
                    message: result.message,
                })
                toast.error(result.message)
                return
            }
            setConflictData(null)
            setOpen(false)
            await onSaved()
            toast.success("Tarea reprogramada con éxito")
        } catch (e) {
            toast.error("No se pudo reprogramar la tarea.")
        }
    }

    const handleUndoChange = async () => {
        setConflictData(null)
        setOpen(false)
        toast.info("No se aplicó la reprogramación.")
    }

    async function handleSave() {
        if (!date) {
            toast.error("Selecciona una fecha válida.")
            return
        }
        if (date < today) {
            toast.error("No puedes reprogramar una tarea a una fecha anterior a hoy.")
            return
        }
        if (date === currentDate) {
            toast.error("Esa es su fecha actual, selecciona otra.")
            return
        }

        const toastId = toast.loading("Guardando nueva fecha...")

        try {
            setIsSaving(true)

            const result = await apiFetch(`/tareas/${taskId}/reprogramar/`, {
                method: "PATCH",
                body: JSON.stringify({
                    fecha_objetivo: date,
                    horas_estimadas: undefined,
                }),
            }) as {
                conflict: boolean
                planned_hours: number
                daily_limit: number
                message: string
            }

            if (result.conflict) {
                setConflictData({
                    taskId,
                    task: {
                        id: taskId,
                        title: taskTitle,
                        date: date,
                        effort: currentEffort,
                    },
                    day: date,
                    scheduledHours: result.planned_hours,
                    dailyLimit: result.daily_limit,
                    message: result.message,
                })
                toast.dismiss(toastId)
                toast.error("Límite diario excedido")
                return
            }

            setOpen(false)
            await onSaved()
            toast.success("Tarea reprogramada con éxito", { id: toastId })
        } catch (error) {
            console.error("Error reprogramando tarea:", error)
            toast.error(
                "No pudimos reprogramar la tarea. Verifica la fecha e inténtalo nuevamente.",
                { id: toastId }
            )
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <Popover
                open={open}
                onOpenChange={(nextOpen) => {
                    if (isSaving) return
                    setOpen(nextOpen)
                }}
            >
                <TooltipProvider>
                    <Tooltip>
                        <PopoverTrigger asChild>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="text-muted-foreground hover:text-primary"
                                    aria-label="Reprogramar subtarea"
                                >
                                    <CalendarClock className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                        </PopoverTrigger>
                        <TooltipContent side="left" align="center">
                            Reprogramar
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <PopoverContent
                    side="right"
                    align="center"
                    sideOffset={8}
                    className="w-72 p-4"
                    onOpenAutoFocus={(e) => {
                        e.preventDefault()
                        inputRef.current?.focus()
                    }}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="space-y-3">
                        <div className="space-y-1 mb-1">
                            {/* <p className="text-sm font-semibold text-foreground">Reprogramar subtarea</p> */}
                            <p className="font-medium text-foreground">
                                Tal vez será mejor otro día...
                            </p>
                        </div>

                        {/* <div className="rounded-xl border bg-muted/30 p-3">
                            <p className="text-sm font-medium">{taskTitle}</p>
                            <p className="text-xs text-muted-foreground">{activityTitle}</p>
                        </div> */}

                        <div className="space-y-2 mb-2 mt-1">
                            <label className="text-xs text-muted-foreground font-medium">¿Para cuando reprogramar?</label>

                            <div className="relative">
                                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={inputRef}
                                    type="date"
                                    className="pl-10"
                                    value={date}
                                    min={today}
                                    onChange={(e) => setDate(e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>

                        <div className="flex gap-1 justify-end">
                            {/* <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSaving}
                            >
                                Cancelar
                            </Button> */}

                            <Button size="sm" className="flex-1" onClick={handleSave} disabled={isSaving || !isDirty}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Reprogramando...
                                    </>
                                ) : (
                                    "Reprogramar"
                                )}
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <OverloadConflictDialog
                open={!!conflictData}
                onOpenChange={(open) => {
                    if (!open) handleUndoChange()
                    else setConflictData(conflictData)
                }}
                task={
                    conflictData?.task
                        ? conflictData.task
                        : { id: undefined, title: "", date: "", effort: 1 }
                }
                day={conflictData?.day || ""}
                scheduledHours={conflictData?.scheduledHours || 0}
                dailyLimit={conflictData?.dailyLimit || 0}
                onSave={handleSaveConflict}
                onDelete={handleUndoChange}
                onResolved={() => {
                    setConflictData(null)
                    setOpen(false)
                    onSaved()
                }}
                context="reprogram"
            />
        </>
    )
}