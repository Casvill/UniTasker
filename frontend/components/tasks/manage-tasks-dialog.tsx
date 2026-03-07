"use client"

import * as React from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog"
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

type ManageTasksDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: Activity | null
  onActivityUpdate: (updatedActivity: Activity) => void
  onRefresh: () => void
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
        onRefresh()
        setIsEditingDescription(false)
        return "Descripción actualizada"
      },
      error: "Error al actualizar la descripción",
    })
  }

  const onSubmitTask = async (values: TaskFormValues) => {
    if (!activity) return

    const promise = apiFetch<any>("/tareas/", {
      method: "POST",
      body: JSON.stringify({
        nombre: values.title,
        fecha_objetivo: values.dueDate,
        horas_estimadas: parseFloat(values.estimatedHours),
        actividad: activity.id,
      }),
    })

    toast.promise(promise, {
      loading: "Creando tarea...",
      success: "Tarea creada",
      error: "Error al crear la tarea",
    })

    await promise
    onRefresh()
    reset()
  }

  const handleUpdateTask = async (id: number | string) => {
    if (!editingTask.title.trim()) return

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
        onRefresh()
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
        onRefresh()
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
      if (task.registrationId) {
        await apiFetch(`/registros/${task.registrationId}/`, {
          method: "DELETE",
        })
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
        toast.success("Tarea completada")
      }

      onRefresh()
    } catch {
      toast.error("No se pudo actualizar el estado de la tarea")
    }
  }

  const handleMarkAllAsDone = async () => {
    if (!activity) return

    try {
      toast.loading("Actualizando actividad...")

      let pending = activity.tasks?.filter((t: any) => !t.registrationId) || []

      if (!activity.tasks || activity.tasks.length === 0) {
        const newTask: any = await apiFetch("/tareas/", {
          method: "POST",
          body: JSON.stringify({
            actividad: activity.id,
            nombre: "General",
            fecha_objetivo: new Date().toISOString().split("T")[0],
            horas_estimadas: 1,
          }),
        })

        pending = [{ id: newTask.id, estimatedHours: 1 } as any]
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

      toast.dismiss()
      toast.success("Actividad completada")
      onRefresh()
    } catch {
      toast.dismiss()
      toast.error("No se pudo completar la actividad")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden border border-border bg-card p-0 text-card-foreground shadow-2xl sm:max-w-[620px]">
        <DialogHeader className="border-b border-border px-6 py-3">
          <div className="space-y-1 pr-8">
            <h2 className="text-2xl font-bold leading-tight text-foreground">
              {activity?.title || "Actividad sin título"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Administra sus tareas y detalles principales.
            </p>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-76px)] overflow-y-auto px-6 py-4 space-y-4">
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

            <div className="flex justify-end">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleMarkAllAsDone}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completar actividad
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">
              Nueva tarea
            </h3>

            <form
              noValidate
              onSubmit={handleSubmit(onSubmitTask)}
              className="space-y-3 rounded-2xl border border-border bg-background/40 p-4"
            >
              <div className="space-y-2">
                <Input
                  id="title"
                  placeholder="Nombre de la tarea"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1">
                  <Input id="dueDate" type="date" {...register("dueDate")} />
                  {errors.dueDate && (
                    <p className="text-xs text-destructive">
                      {errors.dueDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Input
                    id="estimatedHours"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Horas estimadas"
                    {...register("estimatedHours")}
                  />
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
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Tareas de la actividad
              </h3>
              <p className="text-sm text-muted-foreground">
                {visibleTasks.length === 0
                  ? "Aún no has agregado tareas."
                  : `${visibleTasks.length} tarea${visibleTasks.length === 1 ? "" : "s"} registradas.`}
              </p>
            </div>

            <div className="space-y-3 pr-1">
              {visibleTasks.length > 0 ? (
                visibleTasks.map((task: any) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/30"
                  >
                    {editingId === task.id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Nombre de la tarea</Label>
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
                            <Label>Horas estimadas</Label>
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
                            className="mt-1"
                            aria-label={`Cambiar estado de ${task.title}`}
                          />

                          <div className="min-w-0 space-y-2">
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
                                  ? `${task.estimatedHours}h`
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
                <div className="rounded-2xl border border-dashed border-border bg-background/30 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aún no hay tareas para esta actividad.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}