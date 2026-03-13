"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock3, CalendarClock, ArrowDownCircle, Loader2, AlertTriangle, CircleHelp } from "lucide-react"
import { useEffect, useState } from "react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

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
  const [pendingMode, setPendingMode] = useState<null | "reprogram" | "reduce">(null)
  const [showForm, setShowForm] = useState(false)
  const [anim, setAnim] = useState<"in" | "out" | null>(null)
  const [isSaving, setIsSaving] = useState(false);

  const canSaveReprogram = newDate !== task.date
  const canSaveReduce = !!newEffort && Number(newEffort) > 0 && Number(newEffort) !== task.effort
  const todayString = new Date().toISOString().split("T")[0];

  const destructiveLabel =
    context === "create" ? "Deshacer tarea" : "Deshacer cambio"

  useEffect(() => {
    if (!open) {
      setMode("initial")
      setPendingMode(null)
      setShowForm(false)
      setAnim(null)
      setNewDate(task.date)
      setNewEffort(task.effort)
      setIsSaving(false)
    }
  }, [open, task.date, task.effort])

  function handleModeChange(next: "reprogram" | "reduce") {
    setAnim("out")
    setTimeout(() => {
      setMode(next)
      setPendingMode(next)
      setShowForm(true)
      setAnim("in")
    }, 350)
    setTimeout(() => setAnim(null), 700)
  }

  function handleBack() {
    setAnim("out")
    setTimeout(() => {
      setShowForm(false)
      setMode("initial")
      setPendingMode(null)
      setAnim("in")
    }, 350)
    setTimeout(() => setAnim(null), 700)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
            <div className="flex flex-col items-center mb-2">
              <AlertTriangle className="w-8 h-8 text-destructive mb-1" />
              <DialogTitle className="text-destructive text-center">¡No te sobrecargues!</DialogTitle>
            </div>
          <DialogDescription>
            Quedarías con <b>{scheduledHours} horas </b> programadas para el <b>{day}</b>. Estarías excediendo tu límite diario de <b>{dailyLimit} horas.</b>
            <span className="inline-block align-middle ml-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer align-middle"><CircleHelp className="inline w-4 h-4 text-muted-foreground mb-1" /></span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center" className="xs">
                    Puedes configurar tu límite diario en la pestaña de <b>Configuración</b>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          </DialogDescription>
        </DialogHeader>


        {/* Recuadro con la tarea */}
        <div className="rounded-xl border bg-muted/10 p-4 mb-2 space-y-2">
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
        {mode === "initial" && !showForm && (
          <div className={anim === "out" ? "fade-out-down" : "fade-in-up"}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 border-t border-border" />
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Prueba alguna de estas opciones</span>
              <div className="flex-1 border-t border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-1.5">
              <Button
                variant="outline"
                onClick={() => handleModeChange("reprogram")}
                className="flex items-center py-8 text-[16px]"
              >
                <CalendarClock/>
                Reprogramar la fecha
              </Button>
              <Button
                variant="outline"
                onClick={() => handleModeChange("reduce")}
                className="flex items-center py-8 text-[16px]"
              >
                <ArrowDownCircle/>
                Reducir el esfuerzo
              </Button>
            </div>
            {/* <Button
              variant="destructive"
              className="w-full mt-2"
              onClick={onDelete}
            >
              {context === "create" ? "Deshacer tarea" : "Deshacer cambio"}
            </Button> */}
          </div>
        )}

        {/* Opcion secundaria: Reprogramar */}
        {pendingMode === "reprogram" && showForm && (
          <div className={anim === "out" ? "fade-out-down" : "fade-in-up"}>
            <label className="block text-sm font-medium mb-2">¿Para cuando reprogramar la subtarea?</label>
            <Input
              type="date"
              min={todayString}
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button variant="outline" onClick={handleBack}>Atrás</Button>
              <Button
                onClick={async () => {
                  setIsSaving(true);
                  await onSave(newDate, task.effort);
                  setIsSaving(false);
                }}
                disabled={!canSaveReprogram || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Opcion secundaria: Reducir esfuerzo */}
        {pendingMode === "reduce" && showForm && (
          <div className={anim === "out" ? "fade-out-down" : "fade-in-up"}>
            <label className="block text-sm font-medium mb-2">¿A cuantas horas reducir la subtarea?</label>
            <Input
              type="number"
              min={0.5}
              step={0.5}
              value={newEffort === 0 ? "" : newEffort}
              onChange={e => setNewEffort(Number(e.target.value))}
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button type="submit" variant="outline" onClick={handleBack}>Atrás</Button>
              <Button
                onClick={async () => {
                  setIsSaving(true);
                  await onSave(task.date, newEffort);
                  setIsSaving(false);
                }}
                disabled={!canSaveReduce || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}