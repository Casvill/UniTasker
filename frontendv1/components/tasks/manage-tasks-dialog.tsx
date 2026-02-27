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
import { Calendar, Clock, Trash2, CheckCircle2, Pencil } from "lucide-react"

type ManageTasksDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: any
  onActivityUpdate: (updatedActivity: any) => void
  onRefresh: () => void
}

export function ManageTasksDialog({ open, onOpenChange, activity, onActivityUpdate, onRefresh }: ManageTasksDialogProps) {
  const [newSubtask, setNewSubtask] = React.useState({ nombre: "", fecha: "", horas: "" });
  const [editingId, setEditingId] = React.useState<number | string | null>(null);
  const [editingSubtask, setEditingSubtask] = React.useState({ nombre: "", fecha: "", horas: "" });

  const handleCreateSubtask = async () => {
    if (!newSubtask.nombre.trim() || !activity) return;

    const promise = apiFetch<any>("/tareas/", {
      method: "POST",
      body: JSON.stringify({
        nombre: newSubtask.nombre,
        fecha_objetivo: newSubtask.fecha || null,
        horas_estimadas: parseFloat(newSubtask.horas) || 0,
        actividad: activity.id,
      }),
    });

    toast.promise(promise, {
      loading: 'Creando tarea...',
      success: () => {
        onRefresh();
        setNewSubtask({ nombre: "", fecha: "", horas: "" });
        return "Tarea creada";
      },
      error: "Error al crear"
    });
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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-slate-800">Gestionar Tareas</DialogTitle>
            <Button variant="outline" size="sm" className="text-[#00682b] border-[#00682b] hover:bg-[#00682b] hover:text-white" onClick={handleMarkAllAsDone}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Hecho
            </Button>
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="font-bold text-slate-700">{activity?.title}</p>
            <p className="text-sm text-muted-foreground">{activity?.project}</p>
          </div>
        </DialogHeader>

        <div className="p-4 pt-0 space-y-2"> 
          <h3 className="text-lg font-semibold text-slate-800 mb-5">Agregar tarea</h3>
          <div className="grid gap-2 p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
            <Input placeholder="Descripción" className="bg-slate-50 border-none h-8 text-sm" value={newSubtask.nombre} onChange={(e) => setNewSubtask({ ...newSubtask, nombre: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" className="bg-slate-50 border-none h-7 text-xs" value={newSubtask.fecha} onChange={(e) => setNewSubtask({ ...newSubtask, fecha: e.target.value })} />
              <Input type="number" placeholder="Horas" className="bg-slate-50 border-none h-7 text-xs" value={newSubtask.horas} onChange={(e) => setNewSubtask({ ...newSubtask, horas: e.target.value })} />
            </div>
            <Button onClick={handleCreateSubtask}>Guardar Tarea</Button>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Tareas Actuales</h3>
            <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {activity?.subtasks?.filter((s: any) => s.nombre !== "General").length > 0 ? (
                activity.subtasks.filter((s: any) => s.nombre !== "General").map((sub: any) => (
                  <div key={sub.id} className="p-3 bg-white border border-slate-100 rounded-xl hover:border-[#00682b]/30 transition-colors shadow-sm">
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
                          <Checkbox checked={!!sub.registroId} onCheckedChange={() => handleToggleSubtask(sub.id)} className="rounded-full border-slate-300 data-[state=checked]:bg-[#00682b]" />
                          <div className="flex flex-col">
                            <span className={`text-sm font-semibold ${!!sub.registroId ? "line-through text-slate-400" : "text-slate-700"}`}>{sub.nombre}</span>
                            <div className="flex gap-3 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {sub.fecha_objetivo || 'Sin fecha'}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {sub.horas_estimadas}h</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingId(sub.id); setEditingSubtask({ nombre: sub.nombre, fecha: sub.fecha_objetivo || "", horas: sub.horas_estimadas?.toString() || "" }); }} className="h-8 w-8 text-slate-300 hover:text-[#00682b]"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSubtask(sub.id)} className="h-8 w-8 text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><p className="text-xs text-slate-400 italic">No hay subtareas.</p></div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
