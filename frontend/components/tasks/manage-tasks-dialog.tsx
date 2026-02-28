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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Clock, Trash2, CheckCircle2, Pencil, Tag } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubtaskSchema, SubtaskFormValues } from "./subtask-schema"

type ManageTasksDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: any
  onActivityUpdate: (updatedActivity: any) => void
  onRefresh: () => void
}

export function ManageTasksDialog({ open, onOpenChange, activity, onActivityUpdate, onRefresh }: ManageTasksDialogProps) {
  // const [newSubtask, setNewSubtask] = React.useState({ nombre: "", fecha: "", horas: "" });
  const [editingId, setEditingId] = React.useState<number | string | null>(null);
  const [editingSubtask, setEditingSubtask] = React.useState({ nombre: "", fecha: "", horas: "" });

  const form = useForm<SubtaskFormValues>({
    resolver: zodResolver(SubtaskSchema),
    defaultValues: { nombre: "", fecha: "", horas: "" },
    mode: "onTouched",
  });

  const { register, handleSubmit, formState, reset } = form;
  const { errors, isSubmitting } = formState;

  const onSubmitSubtask = async (values: SubtaskFormValues) => {
    if (!activity) return;

    const promise = apiFetch<any>("/tareas/", {
      method: "POST",
      body: JSON.stringify({
        nombre: values.nombre,
        fecha_objetivo: values.fecha,
        horas_estimadas: parseFloat(values.horas),
        actividad: activity.id,
      }),
    });

    toast.promise(promise, {
      loading: 'Creando tarea...',
      success: "Tarea creada",
      error: "Error al crear"
    });

    await promise;
    onRefresh();
    reset();
  };

  const handleUpdateSubtask = async (id: number | string) => {
    if (!editingSubtask.nombre.trim()) return;
    const promise = apiFetch<any>(`/tareas/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        nombre: editingSubtask.nombre,
        fecha_objetivo: editingSubtask.fecha || null,
        horas_estimadas: parseFloat(editingSubtask.horas) || 0,
      }),
    });
    toast.promise(promise, {
      loading: 'Actualizando...',
      success: () => {
        onRefresh();
        setEditingId(null);
        return "Actualizada";
      },
      error: "Error al actualizar"
    });
  };

  const handleDeleteSubtask = async (id: string | number) => {
    if (!confirm("¿Eliminar tarea?")) return;
    const promise = apiFetch(`/tareas/${id}/`, { method: "DELETE" });
    toast.promise(promise, {
      loading: 'Eliminando...',
      success: () => { onRefresh(); return "Eliminada"; },
      error: "Error"
    });
  };

  const handleToggleSubtask = async (id: string | number) => {
    const subtask = activity.subtasks.find((s: any) => s.id === id);
    if (!subtask) return;
    try {
      if (!!subtask.registroId) {
        await apiFetch(`/registros/${subtask.registroId}/`, { method: "DELETE" });
        toast.info("Marcada como pendiente");
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
        toast.success("Completada");
      }
      onRefresh();
    } catch (e) { toast.error("Error"); }
  };

  const handleMarkAllAsDone = async () => {
    if (!activity) return;
    try {
      toast.loading("Actualizando...");
      let pending = activity.subtasks?.filter((s: any) => !s.registroId) || [];
      if (!activity.subtasks || activity.subtasks.length === 0) {
        const newSub: any = await apiFetch("/tareas/", {
          method: "POST",
          body: JSON.stringify({
            actividad: activity.id, nombre: "General",
            fecha_objetivo: new Date().toISOString().split('T')[0],
            horas_estimadas: 1
          })
        });
        pending = [{ id: newSub.id, horas_estimadas: 1 }];
      }
      await Promise.all(pending.map((s: any) => 
        apiFetch("/registros/", {
          method: "POST",
          body: JSON.stringify({
            tarea: s.id, fecha: new Date().toISOString().split('T')[0],
            nota: "Completada", horas_reales: s.horas_estimadas || 0
          }),
        })
      ));
      toast.dismiss();
      toast.success("Todo completado");
      onRefresh();
    } catch (err) { toast.dismiss(); toast.error("Error"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-border bg-card text-card-foreground shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-foreground">Gestionar Actividad</DialogTitle>
            <Button variant="outline" size="sm" onClick={handleMarkAllAsDone} className="ml-auto mr-4">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como hecha
            </Button>
          </div>
          <div className="mt-4 p-4 bg-card rounded-xl border border-border">
            <p className="font-bold text-foreground">{activity?.title}</p>
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <p className="text-m text-muted-foreground">{activity?.project}</p>
            </span>
            <p className="text-sm text-muted-foreground mt-1">{activity?.description?.trim() || null}</p>
          </div>
        </DialogHeader>

        <div className="p-4 pt-0 space-y-2"> 
          <h3 className="text-lg font-semibold text-foreground justify-center">¿Quieres agregar una nueva tarea?</h3>
          <form noValidate onSubmit={handleSubmit(onSubmitSubtask)} className="grid gap-2 p-2 rounded-xl bg-card border border-border shadow-sm">
            <div className="space-y-1">
              <Input placeholder="Describe que tienes que hacer" className="bg-background border-border h-8 text-sm" {...register("nombre")} />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Input type="date" className="bg-background border-border h-7 text-xs" {...register("fecha")} />
                {errors.fecha && <p className="text-xs text-destructive">{errors.fecha.message}</p>}
              </div>
              <div className="space-y-1">
                <Input type="number" placeholder="¿Horas estimadas?" className="bg-background border-border h-7 text-xs" {...register("horas")} />
                {errors.horas && <p className="text-xs text-destructive">{errors.horas.message}</p>}
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando Tarea..." : "Guardar Tarea"}
            </Button>
          </form>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Tareas Actuales</h3>
            <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {activity?.subtasks?.filter((s: any) => s.nombre !== "General").length > 0 ? (
                activity.subtasks.filter((s: any) => s.nombre !== "General").map((sub: any) => (
                  <div key={sub.id} className="p-3 bg-card border border-border rounded-xl hover:border-secondary/40 transition-colors shadow-sm">
                    {editingId === sub.id ? (
                      <div className="space-y-2">
                        <Input className="h-8 text-sm" value={editingSubtask.nombre} onChange={(e) => setEditingSubtask({ ...editingSubtask, nombre: e.target.value })} />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancelar</Button>
                          <Button size="sm" className="h-7 text-xs bg-[#00682b]" onClick={() => handleUpdateSubtask(sub.id)}>Actualizar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={!!sub.registroId} onCheckedChange={() => handleToggleSubtask(sub.id)} className="rounded-full mt-1" />
                          <div className="flex flex-col">
                            <span className={`text-sm font-semibold ${!!sub.registroId ? "line-through text-slate-400" : "text-foreground"}`}>{sub.nombre}</span>
                            <div className="flex gap-3 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {sub.fecha_objetivo || 'Sin fecha'}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {sub.horas_estimadas}h</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingId(sub.id); setEditingSubtask({ nombre: sub.nombre, fecha: sub.fecha_objetivo || "", horas: sub.horas_estimadas?.toString() || "" }); }} className="h-8 w-8 text-muted-foreground"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSubtask(sub.id)} className="h-8 w-8 text-muted-foreground"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-card rounded-2xl border border-dashed border-border">
                  <p className="text-xs text-muted-foreground italic">No hay subtareas.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
