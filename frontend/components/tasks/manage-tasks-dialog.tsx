"use client"

import * as React from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Clock,
  Trash2,
  CheckCircle2,
  Pencil,
  Tag,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { TaskSchema, TaskFormValues } from "./task-schema"
import { Activity } from "./task-types"
import { reprogramTask } from "@/lib/api"
import { OverloadConflictDialog } from "@/components/conflict/overload-conflict-dialog"
import { Loader2, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type ManageTasksDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: Activity | null
  onActivityUpdate: (updatedActivity: Activity) => void
  onRefresh: (silent?: boolean) => void
}

type ProgressData = {
  total_subtareas: number
  hechas: number
  pospuestas: number
  pendientes: number
  progreso_porcentaje: number
  mensaje: string
}

function formatDate(date?: string | null) {
  if (!date) return "Sin fecha límite"

  const [year, month, day] = date.split("-")
  if (!year || !month || !day) return date

  return `${day}/${month}/${year}`
}

export function ManageTasksDialog({
  open,
  onOpenChange,
  activity,
  onActivityUpdate,
  onRefresh,
}: ManageTasksDialogProps) {
  const [editingId, setEditingId] = React.useState<number | string | null>(null)
  const [editingTask, setEditingTask] = React.useState({
    title: "",
    dueDate: "",
    estimatedHours: "",
  })
  const [isEditingDescription, setIsEditingDescription] = React.useState(false)
  const [activityDescription, setActivityDescription] = React.useState("")
  const [showConflictModal, setShowConflictModal] = React.useState(false)
  const [conflictData, setConflictData] = React.useState<null | {
    taskId: number
    task: any
    day: string
    scheduledHours: number
    dailyLimit: number
    message: string
  }>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(true)
  const [hasInitializedFormOpen, setHasInitializedFormOpen] = React.useState(false);
  const [progress, setProgress] = React.useState<ProgressData | null>(null)

  function ProgressBar({ hechas, pospuestas, pendientes, total }: { hechas: number, pospuestas: number, pendientes: number, total: number }) {
    if (total === 0) return <div className="h-3 rounded-full bg-muted/40 w-full" />
    const pctHechas = (hechas / total) * 100
    const pctPospuestas = (pospuestas / total) * 100
    const pctPendientes = (pendientes / total) * 100

    return (
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-muted/40">
        <div style={{ width: `${pctHechas}%` }} className="bg-emerald-500 transition-all " />
        <div style={{ width: `${pctPospuestas}%` }} className="bg-emerald-200 transition-all" />
        <div style={{ width: `${pctPendientes}%` }} className="bg-muted/40 transition-all" />
      </div>
    )
  }

  const minDate = React.useMemo(() => {
    const d = new Date()
    return d.toISOString().split("T")[0]
  }, [])

  React.useEffect(() => {
    if (activity) {
      setActivityDescription(activity.description || "")
      setIsEditingDescription(false)
      setEditingId(null)
      setEditingTask({ title: "", dueDate: "", estimatedHours: "" })
    }
  }, [activity, open])

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskSchema),
    defaultValues: { title: "", dueDate: "", estimatedHours: "" },
    mode: "onTouched",
  })
  const { register, handleSubmit, formState, reset } = form

  React.useEffect(() => {
    if (!open || !activity) {
      reset({ title: "", dueDate: "", estimatedHours: "" })
    }
  }, [open, activity, reset])

  const { errors, isSubmitting } = formState

  const visibleTasks =
    activity?.tasks?.filter((t: any) => t.title !== "General") ?? []

  const handleUpdateDescription = async () => {
    if (!activity) return

    const promise = apiFetch<any>(`/actividades/${activity.id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        descripcion: activityDescription,
      }),
    })

    toast.promise(promise, {
      loading: "Actualizando descripción...",
      success: (updated) => {
        onActivityUpdate({
          ...activity,
          description: updated.descripcion ?? activityDescription,
        })
        onRefresh(true)
        setIsEditingDescription(false)
        return "Descripción actualizada"
      },
      error: "Error al actualizar la descripción",
    })
  }

  React.useEffect(() => {
    if (!open || !activity) {
      setProgress(null)
      return
    }
    apiFetch<ProgressData>(`/actividades/${activity.id}/progreso/`)
      .then(setProgress)
      .catch(() => setProgress(null))
  }, [activity, open])

  React.useEffect(() => {
    if (open && !hasInitializedFormOpen) {
      setIsFormOpen(visibleTasks.length === 0);
      setHasInitializedFormOpen(true);
    }
    if (!open) {
      setHasInitializedFormOpen(false);
    }
  }, [open]);

  const refreshProgress = async () => {
    if (!activity) return
    try {
      const data = await apiFetch<ProgressData>(`/actividades/${activity.id}/progreso/`)
      setProgress(data)
    } catch {
      setProgress(null)
    }
  }
  
  const onSubmitTask = async (values: TaskFormValues) => {
    if (!activity) return

    let createdTask
    const promise = apiFetch<any>("/tareas/", {
      method: "POST",
      body: JSON.stringify({
        nombre: values.title,
        fecha_objetivo: values.dueDate,
        horas_estimadas: parseFloat(values.estimatedHours),
        actividad: activity.id,
      }),
    })

    await toast.promise(promise, {
      loading: "Creando tarea...",
      success: "Tarea creada",
      error: "Error al crear la tarea",
    })

    try {
      createdTask = await promise;
    } catch (e) {
    
      return;
    }

    try {
      const result = await reprogramTask(
        createdTask.id,
        createdTask.fecha_objetivo,
        parseFloat(createdTask.horas_estimadas)
      ) as { conflict: boolean; planned_hours: number; daily_limit: number; message: string };

      if (result.conflict) {
        setConflictData({
          taskId: createdTask.id,
          task: {
            title: createdTask.nombre,
            date: createdTask.fecha_objetivo,
            effort: parseFloat(createdTask.horas_estimadas),
          },
          day: createdTask.fecha_objetivo,
          scheduledHours: result.planned_hours,
          dailyLimit: result.daily_limit,
          message: result.message,
        })
        toast.error("Límite diario excedido")
        return;
      }
    } catch (e) {
      toast.error("No se pudo validar la capacidad diaria.");
      return;
    }

    onRefresh(true);
    refreshProgress();
    reset();
  }

  const handleUpdateTask = async (id: number | string) => {
    if (!editingTask.title.trim()) return

    try {
      const result = await reprogramTask(
        Number(id),
        editingTask.dueDate,
        parseFloat(editingTask.estimatedHours)
      ) as { conflict: boolean; message: string };

      if (
        typeof result === "object" &&
        result !== null &&
        "conflict" in result &&
        "message" in result
      ) {
        const { conflict, message } = result;
        if (conflict) {
          toast.error(message);
          return;
        }
      }
    } catch (e) {
      toast.error("No se pudo validar la capacidad diaria.");
      return;
    }

    const promise = apiFetch<any>(`/tareas/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        nombre: editingTask.title,
        fecha_objetivo: editingTask.dueDate || null,
        horas_estimadas: parseFloat(editingTask.estimatedHours) || 0,
      }),
    })

    toast.promise(promise, {
      loading: "Actualizando tarea...",
      success: () => {
        onRefresh(true)
        refreshProgress();
        setEditingId(null)
        return "Tarea actualizada"
      },
      error: "Error al actualizar la tarea",
    })
  }

  const handleDeleteTask = async (id: string | number) => {
    if (!confirm("¿Seguro que deseas eliminar esta tarea?")) return

    const promise = apiFetch(`/tareas/${id}/`, { method: "DELETE" })

    toast.promise(promise, {
      loading: "Eliminando tarea...",
      success: () => {
        onRefresh(true)
        refreshProgress();
        return "Tarea eliminada"
      },
      error: "Error al eliminar la tarea",
    })
  }

  const handleToggleTask = async (id: string | number) => {
    if (!activity) return

    const task = activity.tasks.find((t: any) => t.id === id)
    if (!task) return

    try {
      const isCurrentlyDone = task.completed;
      const newStatus = isCurrentlyDone ? "pendiente" : "hecha";
      
      toast.loading(isCurrentlyDone ? "Actualizando..." : "Completando...");

      // Actualizar estado de la tarea en la BD
      await apiFetch(`/tareas/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ estado: newStatus }),
      });

      if (isCurrentlyDone) {
        if (task.registrationId) {
          await apiFetch(`/registros/${task.registrationId}/`, {
            method: "DELETE",
          })
        }
        toast.dismiss();
        toast.info("Tarea marcada como pendiente")
      } else {
        await apiFetch("/registros/", {
          method: "POST",
          body: JSON.stringify({
            tarea: id,
            fecha: new Date().toISOString().split("T")[0],
            nota: "Completada",
            horas_reales: task.estimatedHours || 0,
          }),
        })
        toast.dismiss();
        toast.success("Tarea completada")
      }

      onRefresh(true);
      refreshProgress();
    } catch {
      toast.dismiss();
      toast.error("No se pudo actualizar el estado de la tarea")
    }
  }

  const handleSaveConflict = async (newDate: string, newEffort: number) => {
    if (!conflictData) return
    try {
      const result = await reprogramTask(
        conflictData.taskId,
        newDate,
        newEffort
      ) as {
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
      setConflictData(null);
      onRefresh(true);
      refreshProgress();
      reset()
    } catch (e) {
      toast.error("No se pudo reprogramar la tarea.")
    }
  }

  const handleDeleteConflictTask = async () => {
    if (!conflictData) return
    try {
      await apiFetch(`/tareas/${conflictData.taskId}/`, { method: "DELETE" })
      setConflictData(null)
      toast.success("Tarea eliminada")
      onRefresh(true);
      refreshProgress();
    } catch (e) {
      toast.error("No se pudo eliminar la tarea")
    }
  }

  const handleMarkAllAsDone = async () => {
    if (!activity) return

    try {
      toast.loading("Actualizando actividad...")

      let pending = activity.tasks?.filter((t: any) => !t.completed) || []

      if (!activity.tasks || activity.tasks.length === 0) {
        const newTask: any = await apiFetch("/tareas/", {
          method: "POST",
          body: JSON.stringify({
            actividad: activity.id,
            nombre: "General",
            fecha_objetivo: new Date().toISOString().split("T")[0],
            horas_estimadas: 1,
            estado: "hecha"
          }),
        })

        pending = [{ id: newTask.id, estimatedHours: 1 } as any]
      } else {
        // Actualizar estado de las tareas pendientes
        await Promise.all(
          pending.map((t: any) =>
            apiFetch(`/tareas/${t.id}/`, {
              method: "PATCH",
              body: JSON.stringify({ estado: "hecha" }),
            })
          )
        )
      }

      await Promise.all(
        pending.map((t: any) =>
          apiFetch("/registros/", {
            method: "POST",
            body: JSON.stringify({
              tarea: t.id,
              fecha: new Date().toISOString().split("T")[0],
              nota: "Completada",
              horas_reales: t.estimatedHours || 0,
            }),
          })
        )
      )

      toast.dismiss();
      toast.success("Actividad completada");
      onRefresh(true);
      refreshProgress();
    } catch {
      toast.dismiss()
      toast.error("No se pudo completar la actividad")
    }
  }

  return (
  <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden border border-border bg-card p-0 text-card-foreground shadow-2xl sm:max-w-[620px]">
        <DialogHeader className="border-b border-border px-6 py-3">
          <div className="space-y-1 pr-8">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-2xl font-bold leading-tight text-foreground flex items-center gap-2 mt-2">
                {activity?.title || "Actividad sin título"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Administra subtareas y detalles principales de esta actividad.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-76px)] overflow-y-auto px-6 pt-2 space-y-4">
          <section className="rounded-2xl border border-border bg-background/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {activity?.project || "Sin curso"}
              </span>

              <span className="flex items-center gap-2 font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {activity?.dueDate
                  ? formatDate(activity.dueDate)
                  : "Sin fecha límite"}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">Descripción</Label>

                {!isEditingDescription ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                ) : null}
              </div>

              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                    placeholder="Describe brevemente la actividad"
                    className="min-h-[88px]"
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActivityDescription(activity?.description || "")
                        setIsEditingDescription(false)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUpdateDescription}
                    >
                      Guardar descripción
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {activity?.description?.trim()
                    ? activity.description
                    : "Esta actividad no tiene descripción."}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <div className="flex items-center gap-3 mb-1"> 
                <h3 className="text-xl font-semibold text-foreground">
                  Subtareas 
                </h3>
                {visibleTasks.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs flex items-center gap-1 text-emerald-400 border-emerald-600 hover:bg-emerald-50"
                    onClick={handleMarkAllAsDone}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Completar todas
                  </Button>
                )}
              </div>
              {/* <p className="text-sm text-muted-foreground">
                {visibleTasks.length === 0
                  ? "Aún no has agregado subtareas"
                  : `${visibleTasks.length} subtarea${visibleTasks.length === 1 ? "" : "s"} registradas.`}
              </p> */}
              {progress === null ? (
                <div className="flex items-center gap-0.5 mb-1 mt-2">
                  <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent animate-[shimmer_1.5s_infinite]" />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[80px] text-right mr-2">
                    Cargando
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 mb-1 mt-2">
                  <ProgressBar
                    hechas={progress.hechas}
                    pospuestas={progress.pospuestas}
                    pendientes={progress.pendientes}
                    total={progress.total_subtareas}
                  />
                  <span className="text-xs text-muted-foreground min-w-[80px] text-right mr-2">
                    {progress.progreso_porcentaje}% hecho
                  </span>
                </div>
              )}
              {/* <p className="text-sm text-muted-foreground">
                {progress
                  ? progress.mensaje
                  : "Cargando progreso..."}
              </p> */}
              </div>
            <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
              <div className="rounded-2xl border border-border bg-background/40 overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-base font-semibold text-foreground hover:text-primary transition focus:outline-none rounded-t-2xl bg-transparent"
                    aria-label={isFormOpen ? "Ocultar formulario" : "Mostrar formulario"}
                    tabIndex={-1}
                  >
                    {isFormOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                    Crear nueva subtarea
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <form
                    noValidate
                    onSubmit={handleSubmit(onSubmitTask)}
                    className="space-y-3 px-4 pb-4 pt-2"
                  >
                    <div className="space-y-2">
                      <Input
                        id="title"
                        placeholder="Nombre de la subtarea"
                        {...register("title")}
                      />
                      {errors.title && (
                        <p className="text-xs text-destructive">{errors.title.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                      <div className="space-y-1">
                        <Input id="dueDate" type="date" min={minDate} {...register("dueDate")} />
                        {errors.dueDate && (
                          <p className="text-xs text-destructive">
                            {errors.dueDate.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              id="estimatedHours"
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="Esfuerzo"
                              {...register("estimatedHours")}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            ¿Cuantas horas le estimas?
                          </TooltipContent>
                        </Tooltip>
                        {errors.estimatedHours && (
                          <p className="text-xs text-destructive">
                            {errors.estimatedHours.message}
                          </p>
                        )}
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="sm:self-start">
                        {isSubmitting ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </form>
                </CollapsibleContent>
              </div>
            </Collapsible>
            <div className={`space-y-3 ${visibleTasks.length > 0 ? "mb-13" : "mb-7"}`}>
              {visibleTasks.length > 0 ? (
                visibleTasks.map((task: any) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/30"
                  >
                    {editingId === task.id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Nombre de la subtarea</Label>
                          <Input
                            value={editingTask.title}
                            onChange={(e) =>
                              setEditingTask({
                                ...editingTask,
                                title: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Fecha objetivo</Label>
                            <Input
                              type="date"
                              min={minDate}
                              value={editingTask.dueDate}
                              onChange={(e) =>
                                setEditingTask({
                                  ...editingTask,
                                  dueDate: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Esfuerzo</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={editingTask.estimatedHours}
                              onChange={(e) =>
                                setEditingTask({
                                  ...editingTask,
                                  estimatedHours: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUpdateTask(task.id)}
                          >
                            Guardar cambios
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(task.id)}
                            className="h-6 w-6 self-center ml-1 mr-1"
                            aria-label={`Cambiar estado de ${task.title}`}
                          />

                          <div className="min-w-0 space-y-1">
                            <p
                              className={`text-sm font-semibold ${task.completed
                                ? "line-through text-muted-foreground"
                                : "text-foreground"
                                }`}
                            >
                              {task.title}
                            </p>

                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {task.dueDate || "Sin fecha"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {task.estimatedHours
                                  ? `${parseInt(task.estimatedHours)}h`
                                  : "Sin estimación"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingId(task.id)
                              setEditingTask({
                                title: task.title,
                                dueDate: task.dueDate || "",
                                estimatedHours:
                                  task.estimatedHours?.toString() || "",
                              })
                            }}
                            aria-label={`Editar ${task.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                            aria-label={`Eliminar ${task.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/30 py-8 text-center min-h-[115px] flex flex-col justify-center grow" style={{height: '100%'}}>
                  <p className="text-sm text-muted-foreground">
                    Cada plan empieza con un primer paso. Crea una subtarea
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
    <OverloadConflictDialog
      open={!!conflictData}
      onOpenChange={(open) => setConflictData(open ? conflictData : null)}
      task={conflictData?.task || { title: "", date: "", effort: 1 }}
      day={conflictData?.day || ""}
      scheduledHours={conflictData?.scheduledHours || 0}
      dailyLimit={conflictData?.dailyLimit || 0}
      onSave={handleSaveConflict}
      onDelete={handleDeleteConflictTask}
      context="create"
    />
    </>
  )
}