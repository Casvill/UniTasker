"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, CalendarDays } from "lucide-react"
import { toast } from "sonner"

import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { OverloadConflictDialog } from "@/components/conflict/overload-conflict-dialog"

type ReprogramTaskDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
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

export function ReprogramTaskDialog({
    open,
    onOpenChange,
    taskId,
    taskTitle,
    activityTitle,
    currentDate,
    currentEffort,
    onSaved,
}: ReprogramTaskDialogProps) {
    const [date, setDate] = useState(currentDate)
    const [isSaving, setIsSaving] = useState(false)

    const today = useMemo(() => getTodayString(), [])

    const [conflictData, setConflictData] = useState<null | {
    taskId: number
    task: { title: string; date: string; effort: number }
    day: string
    scheduledHours: number
    dailyLimit: number
    message: string
    }>(null)

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
            onOpenChange(false)
            await onSaved()
            toast.success("Tarea reprogramada con éxito")
        } catch (e) {
            toast.error("No se pudo reprogramar la tarea.")
        }
    }

    const handleUndoChange = async () => {
    setConflictData(null)
    onOpenChange(false)
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
        toast.error("Selecciona una fecha diferente a la actual.")
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
            return
        }

        onOpenChange(false)
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
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reprogramar subtarea</DialogTitle>
                        <DialogDescription>
                            A veces es mejor mejor dejarlo para otro día...
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-xl border bg-muted/30 p-3">
                            <p className="text-sm font-medium">{taskTitle}</p>
                            <p className="text-xs text-muted-foreground">{activityTitle}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">¿Para cuando reprogramar?</label>

                            <div className="relative mt-1">
                                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-10"
                                    value={date}
                                    min={today}
                                    onChange={(e) => setDate(e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 mt-4">
                        <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>

                        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Reprogramando...
                                </>
                            ) : (
                                "Reprogramar"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <OverloadConflictDialog
            open={!!conflictData}
            onOpenChange={(open) => {
                if (!open) handleUndoChange()
                else setConflictData(conflictData)
            }}
            task={conflictData?.task || { title: "", date: "", effort: 1 }}
            day={conflictData?.day || ""}
            scheduledHours={conflictData?.scheduledHours || 0}
            dailyLimit={conflictData?.dailyLimit || 0}
            onSave={handleSaveConflict}
            onDelete={handleUndoChange}
            context="reprogram"
        />
     </>)
}