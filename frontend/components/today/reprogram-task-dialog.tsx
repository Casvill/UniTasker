"use client"

import { useEffect, useState } from "react"
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

type ReprogramTaskDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    taskId: number
    taskTitle: string
    activityTitle: string
    currentDate: string
    onSaved: () => Promise<void> | void
}

export function ReprogramTaskDialog({
    open,
    onOpenChange,
    taskId,
    taskTitle,
    activityTitle,
    currentDate,
    onSaved,
}: ReprogramTaskDialogProps) {
    const [date, setDate] = useState(currentDate)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (open) {
            setDate(currentDate)
        }
    }, [open, currentDate])

    async function handleSave() {
        if (!date) {
            toast.error("Selecciona una fecha válida.")
            return
        }

        if (date === currentDate) {
            toast.error("Selecciona una fecha diferente a la actual.")
            return
        }

        const toastId = toast.loading("Guardando nueva fecha...")

        try {
            setIsSaving(true)

            await apiFetch(`/tareas/${taskId}/`, {
                method: "PATCH",
                body: JSON.stringify({
                    fecha_objetivo: date,
                }),
            })

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reprogramar subtarea</DialogTitle>
                    <DialogDescription>
                        Selecciona una nueva fecha objetivo para esta subtarea.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-sm font-medium">{taskTitle}</p>
                        <p className="text-xs text-muted-foreground">{activityTitle}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nueva fecha objetivo</label>

                        <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="date"
                                className="pl-10"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>

                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar cambios"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}