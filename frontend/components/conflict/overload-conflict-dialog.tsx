"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock3 } from "lucide-react"
import { useState } from "react"

type OverloadConflictDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: { title: string; date: string; effort: number }
  day: string
  scheduledHours: number
  dailyLimit: number
  onSave: (newDate: string, newEffort: number) => void
  onDelete: () => void
  context: "create" | "edit" | "reprogram" // <--- NUEVO
}

export function OverloadConflictDialog({
  open,
  onOpenChange,
  task,
  day,
  scheduledHours,
  dailyLimit,
  onSave,
  onDelete,
  context,
}: OverloadConflictDialogProps) {
  const [mode, setMode] = useState<"initial" | "reprogram" | "reduce">("initial")
  const [newDate, setNewDate] = useState(task.date)
  const [newEffort, setNewEffort] = useState(task.effort)

  // Habilita guardar solo si hay cambios válidos
  const canSaveReprogram = newDate !== task.date
  const canSaveReduce = newEffort > 0 && newEffort !== task.effort

  const destructiveLabel =
    context === "create" ? "Deshacer tarea" : "Deshacer cambio"

  function handleBack() {
    setMode("initial")
    setNewDate(task.date)
    setNewEffort(task.effort)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">¡No te sobrecargues!</DialogTitle>
          <DialogDescription>
            Para el día <b>{day}</b> quedarías con <b>{scheduledHours}h</b> programadas.
            <br />
            Estarías excediendo tu límite diario de <b>{dailyLimit}h</b>.
          </DialogDescription>
        </DialogHeader>

        {/* Recuadro con la tarea */}
        <div className="rounded-xl border bg-muted/10 p-4 mb-4 space-y-2">
          <div className="font-semibold text-foreground">{task.title}</div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {task.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock3 className="w-4 h-4" />
              Esfuerzo: {task.effort}h
            </span>
          </div>
        </div>

        {/* Opciones iniciales */}
        {mode === "initial" && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <Button variant="outline" className="h-16" onClick={() => setMode("reprogram")}>
                Reprogramar a otra fecha
              </Button>
              <Button variant="outline" className="h-16" onClick={() => setMode("reduce")}>
                Reducir esfuerzo
              </Button>
            </div>
            <Button
              variant="destructive"
              className="w-full mt-2"
              onClick={onDelete}
            >
              {destructiveLabel}
            </Button>
          </>
        )}

        {/* Reprogramar */}
        {mode === "reprogram" && (
          <div className="space-y-3">
            <label className="block text-sm font-medium mb-1">Nueva fecha</label>
            <Input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={handleBack}>Atrás</Button>
              <Button
                onClick={() => onSave(newDate, task.effort)}
                disabled={!canSaveReprogram}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}

        {/* Reducir esfuerzo */}
        {mode === "reduce" && (
          <div className="space-y-3">
            <label className="block text-sm font-medium mb-1">Nuevo esfuerzo (horas)</label>
            <Input
              type="number"
              min={0.5}
              step={0.5}
              value={newEffort}
              onChange={e => setNewEffort(Number(e.target.value))}
            />
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={handleBack}>Atrás</Button>
              <Button
                onClick={() => onSave(task.date, newEffort)}
                disabled={!canSaveReduce}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}