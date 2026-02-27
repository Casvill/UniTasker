"use client"

import * as React from "react"
import { apiFetch } from "@/lib/api"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Trash2, CheckCircle2, Pencil } from "lucide-react"

const TaskSchema = z.object({
    title: z.string().min(2, "El título es obligatorio (mínimo 2 caracteres)."),
    type: z.enum(["examen", "quiz", "taller", "proyecto", "otro"]).default("otro"),
    course: z.string().min(2, "El curso es obligatorio (mínimo 2 caracteres)."),
    dueDate: z.string().min(1, "La fecha de entrega es obligatoria."),
    description: z.string().optional(),
})

type TaskFormValues = z.infer<typeof TaskSchema>

type CreateTaskDialogProps = {
    onCreated?: () => void
    activity?: any
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CreateTaskDialog({ onCreated, activity, open: controlledOpen, onOpenChange }: CreateTaskDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const open = controlledOpen ?? internalOpen
    const setOpen = onOpenChange ?? setInternalOpen

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(TaskSchema),
        defaultValues: {
            title: activity?.title || "",
            type: activity?.tags?.[0] || "otro",
            course: activity?.project || "",
            dueDate: activity?.dueDate ? (activity.dueDate.includes('/') ? activity.dueDate.split('/').reverse().join('-') : activity.dueDate) : "",
            description: activity?.description || "",
        },
        mode: "onTouched",
    })

    const { register, handleSubmit, setValue, watch, formState, reset } = form
    const { errors, isSubmitting } = formState
    const selectedType = watch("type")

    // Update form when activity changes
    React.useEffect(() => {
        if (activity) {
            reset({
                title: activity.title,
                type: activity.tags?.[0] || "otro",
                course: activity.project,
                dueDate: activity.dueDate ? (activity.dueDate.includes('/') ? activity.dueDate.split('/').reverse().join('-') : activity.dueDate) : "",
                description: activity.description || "",
            })
        }
    }, [activity, reset])

    const onSubmit = async (values: TaskFormValues) => {
        const payload = {
            titulo: values.title.trim(),
            tipo: values.type,
            curso: values.course.trim(),
            fecha_entrega: values.dueDate,
            descripcion: (values.description ?? "").trim(),
        }

        try {
            if (activity?.id) {
                await apiFetch(`/actividades/${activity.id}/`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                })
                toast.success("Actividad actualizada exitosamente.")
            } else {
                await apiFetch("/actividades/", {
                    method: "POST",
                    body: JSON.stringify(payload),
                })
                toast.success("Actividad creada exitosamente.")
            }
            onCreated?.()

            reset()
            setOpen(false)
        } catch (e: any) {
            toast.error(e?.message ?? "No se pudo guardar la actividad.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!activity && (
                <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                        + Crear Actividad
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>{activity ? "Editar actividad" : "Nueva actividad"}</DialogTitle>
                    <DialogDescription>
                        {activity ? "Modifica los campos de tu actividad." : "Completa los campos mínimos para registrar tu actividad evaluativa."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="title">Título de actividad *</Label>
                        <Input id="title" placeholder="Ej: Parcial de Cálculo" {...register("title")} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>¿Cómo te van a evaluar? *</Label>
                        <Select
                            value={selectedType}
                            onValueChange={(v) =>
                                setValue("type", v as TaskFormValues["type"], {
                                    shouldValidate: true,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="examen">Examen</SelectItem>
                                <SelectItem value="quiz">Quiz</SelectItem>
                                <SelectItem value="taller">Taller</SelectItem>
                                <SelectItem value="proyecto">Proyecto</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="course">Curso *</Label>
                        <Input id="course" placeholder="Ej: Matemáticas II" {...register("course")} />
                        {errors.course && <p className="text-sm text-destructive">{errors.course.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="dueDate">Fecha de entrega *</Label>
                        <Input id="dueDate" type="date" {...register("dueDate")} />
                        {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description">Descripción (opcional)</Label>
                        <Input id="description" placeholder="Ej: Temas 1-3, llevar calculadora" {...register("description")} />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                reset()
                                setOpen(false)
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

type ManageTasksDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: any
  onActivityUpdate: (updatedActivity: any) => void
  onRefresh: () => void
}

export function ManageTasksDialog({ open, onOpenChange, activity, onActivityUpdate, onRefresh }: ManageTasksDialogProps) {
  const [newSubtask, setNewSubtask] = React.useState({
    nombre: "",
    fecha: "",
    horas: ""
  });

  const [editingId, setEditingId] = React.useState<number | string | null>(null);
  const [editingSubtask, setEditingSubtask] = React.useState({
    nombre: "",
    fecha: "",
    horas: ""
  });

  const handleCreateSubtask = async () => {
    if (!newSubtask.nombre.trim() || !activity) return;

    const body = {
      nombre: newSubtask.nombre,
      fecha_objetivo: newSubtask.fecha || null,
      horas_estimadas: parseFloat(newSubtask.horas) || 0,
      actividad: activity.id,
      estado: "pendiente"
    };

    const promise = apiFetch<any>("/tareas/", {
      method: "POST",
      body: JSON.stringify(body),
    });

    toast.promise(promise, {
      loading: 'Creando tarea...',
      success: (response) => {
        onRefresh();
        setNewSubtask({ nombre: "", fecha: "", horas: "" });
        return "Tarea creada correctamente";
      },
      error: "No se pudo crear la tarea"
    });
  };

  const handleUpdateSubtask = async (id: number | string) => {
    if (!editingSubtask.nombre.trim()) return;

    const body = {
      nombre: editingSubtask.nombre,
      fecha_objetivo: editingSubtask.fecha || null,
      horas_estimadas: parseFloat(editingSubtask.horas) || 0,
    };

    const promise = apiFetch<any>(`/tareas/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    toast.promise(promise, {
      loading: 'Actualizando tarea...',
      success: (response) => {
        onRefresh();
        setEditingId(null);
        return "Tarea actualizada correctamente";
      },
      error: "No se pudo actualizar la tarea"
    });
  };

  const startEditing = (sub: any) => {
    setEditingId(sub.id);
    setEditingSubtask({
      nombre: sub.nombre,
      fecha: sub.fecha_objetivo || "",
      horas: sub.horas_estimadas?.toString() || ""
    });
  };

  const handleDeleteSubtask = async (id: string | number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;

    const promise = apiFetch(`/tareas/${id}/`, {
      method: "DELETE",
    });

    toast.promise(promise, {
      loading: 'Eliminando tarea...',
      success: () => {
        onRefresh();
        return "Tarea eliminada";
      },
      error: "No se pudo eliminar la tarea"
    });
  };

  const handleToggleSubtask = async (id: string | number) => {
    const subtask = activity.subtasks.find((s: any) => s.id === id);
    if (!subtask) return;

    const isCurrentlyDone = !!subtask.registroId;

    try {
      if (isCurrentlyDone) {
        await apiFetch(`/registros/${subtask.registroId}/`, { method: "DELETE" });
        toast.info("Tarea marcada como pendiente");
      } else {
        await apiFetch("/registros/", {
          method: "POST",
          body: JSON.stringify({
            tarea: id,
            fecha: new Date().toISOString().split('T')[0],
            nota: "Completada",
            horas_reales: subtask.horas_estimadas || 0
          }),
        });
        toast.success("Tarea completada");
      }
      onRefresh(); // Llamamos al refresh para recargar los datos
    } catch (error) {
      toast.error("Error al sincronizar con el servidor");
    }
  };

  const handleMarkAllAsDone = async () => {
    if (!activity) return;

    try {
      toast.loading("Actualizando tareas...");
      
      let pendingSubtasks = activity.subtasks?.filter((s: any) => !s.registroId) || [];

      // Si no hay tareas, creamos una por defecto para poder marcarla
      if (!activity.subtasks || activity.subtasks.length === 0) {
        const newSub: any = await apiFetch("/tareas/", {
          method: "POST",
          body: JSON.stringify({
            actividad: activity.id,
            nombre: "General",
            fecha_objetivo: new Date().toISOString().split('T')[0],
            horas_estimadas: 1
          })
        });
        pendingSubtasks = [{ id: newSub.id, horas_estimadas: 1 }];
      }

      if (pendingSubtasks.length > 0) {
        await Promise.all(pendingSubtasks.map((s: any) => 
          apiFetch("/registros/", {
            method: "POST",
            body: JSON.stringify({
              tarea: s.id,
              fecha: new Date().toISOString().split('T')[0],
              nota: "Completada",
              horas_reales: s.horas_estimadas || 0
            }),
          })
        ));
      }
      
      toast.dismiss();
      toast.success("Todas las tareas completadas");
      onRefresh();
    } catch (err) {
      toast.dismiss();
      toast.error("No se pudo completar la operación");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-slate-800">
              Gestionar Tareas
            </DialogTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-[#00682b] border-[#00682b] hover:bg-[#00682b] hover:text-white transition-all"
              onClick={handleMarkAllAsDone}
            >
              <CheckCircle2 className="h-4 w-4" />
              Marcar todo como hecho
            </Button>
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="font-bold text-slate-700">{activity?.title}</p>
            <p className="text-sm text-muted-foreground">{activity?.project}</p>
          </div>
        </DialogHeader>

        <div className="p-4 pt-0 space-y-2"> 
          <h3 className="text-lg font-semibold text-slate-800 mb-5" >Agregar tarea</h3>

          <section className="space-y-1 -mt-2"> 
            <div className="grid gap-2 p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Input
                placeholder="Descripción de la tarea"
                className="border-none bg-slate-50 focus-visible:ring-[#00682b] h-8 text-sm"
                value={newSubtask.nombre}
                onChange={(e) => setNewSubtask({ ...newSubtask, nombre: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <Label className="text-[9px] uppercase text-slate-400 ml-1 mb-0.5">
                    Fecha
                  </Label>
                  <Input
                    type="date"
                    className="bg-slate-50 border-none h-7 text-xs focus-visible:ring-[#00682b]" 
                    value={newSubtask.fecha}
                    onChange={(e) => setNewSubtask({ ...newSubtask, fecha: e.target.value })}
                  />
                </div>
                
                <div className="flex flex-col">
                  <Label className="text-[9px] uppercase text-slate-400 ml-1 mb-0.5">
                    Horas
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    className="bg-slate-50 border-none h-7 text-xs focus-visible:ring-[#00682b]"
                    value={newSubtask.horas}
                    onChange={(e) => setNewSubtask({ ...newSubtask, horas: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleCreateSubtask}>
                Guardar Tarea
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Tareas Actuales</h3>
            <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {activity?.subtasks?.filter((s: any) => s.nombre !== "General").length > 0 ? (
                activity.subtasks.filter((s: any) => s.nombre !== "General").map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-white border border-slate-100 rounded-xl hover:border-[#00682b]/30 transition-colors shadow-sm"
                  >
                    {editingId === sub.id ? (
                      <div className="space-y-2">
                        <Input
                          className="h-8 text-sm"
                          value={editingSubtask.nombre}
                          onChange={(e) => setEditingSubtask({ ...editingSubtask, nombre: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            className="h-7 text-xs"
                            value={editingSubtask.fecha}
                            onChange={(e) => setEditingSubtask({ ...editingSubtask, fecha: e.target.value })}
                          />
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            value={editingSubtask.horas}
                            onChange={(e) => setEditingSubtask({ ...editingSubtask, horas: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                            Cancelar
                          </Button>
                          <Button size="sm" className="h-7 text-xs bg-[#00682b] hover:bg-[#00682b]/90" onClick={() => handleUpdateSubtask(sub.id)}>
                            Actualizar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={!!sub.registroId}
                            onCheckedChange={() => handleToggleSubtask(sub.id)}
                            className="rounded-full border-slate-300 data-[state=checked]:bg-[#00682b] data-[state=checked]:border-[#00682b]"
                          />
                          <div className="flex flex-col">
                            <span
                              className={`text-sm font-semibold ${
                                !!sub.registroId ? "line-through text-slate-400" : "text-slate-700"
                              }`}
                            >
                              {sub.nombre}
                            </span>
                            <div className="flex gap-3 text-[10px] text-slate-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {sub.fecha_objetivo || 'Sin fecha'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {sub.horas_estimadas}h
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(sub)}
                            className="h-8 w-8 text-slate-300 hover:text-[#00682b] hover:bg-green-50 transition-all"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubtask(sub.id)}
                            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic">
                    No hay subtareas creadas para esta actividad.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
