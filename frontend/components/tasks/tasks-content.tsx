"use client"

import { Search, Filter, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { CreateActivityDialog } from "./create-activity-dialog"
import { ManageTasksDialog } from "./manage-tasks-dialog"
import { SkeletonTasks } from "./task-skeleton"
import { TaskCard } from "./task-card"
import { Task, normalizePriority, formatDueDate } from "./task-types"

type TasksContentProps = {
  refreshKey: number
}

export function TasksContent({ refreshKey }: TasksContentProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<any>(null);

  const handleOpenManageDialog = (actividad: any) => {
    setSelectedActivity(actividad);
    setIsManageDialogOpen(true);
  };

  const handleOpenEditActivity = (e: React.MouseEvent, activity: any) => {
    e.stopPropagation();
    setActivityToEdit(activity);
    setIsEditActivityOpen(true);
  };

  const handleDeleteActivity = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta actividad?")) return;

    try {
      await apiFetch(`/actividades/${taskId}/`, { method: "DELETE" });
      toast.success("Actividad eliminada");
      loadTasks();
    } catch (error) {
      toast.error("No se pudo eliminar la actividad");
    }
  };

  const handleToggleSubtask = async (activityId: number, subtaskId: number) => {
    const targetTask = tasks.find(t => t.id === activityId);
    if (!targetTask) return;
    const subtask = targetTask.subtasks.find((s: any) => s.id === subtaskId);
    if (!subtask) return;

    try {
      if (!!subtask.registroId) {
        await apiFetch(`/registros/${subtask.registroId}/`, { method: "DELETE" });
        toast.info("Tarea marcada como pendiente");
      } else {
        await apiFetch("/registros/", {
          method: "POST",
          body: JSON.stringify({
            tarea: subtaskId,
            fecha: new Date().toISOString().split('T')[0],
            nota: "Completada",
            horas_reales: subtask.horas_estimadas || 0
          }),
        });
        toast.success("Tarea completada");
      }
      loadTasks();
    } catch (error) {
      toast.error("Error al sincronizar con el servidor");
    }
  };

  const handleToggleActivity = async (task: Task) => {
    const shouldComplete = !task.completed;
    try {
      toast.loading(shouldComplete ? "Completando..." : "Actualizando...");
      if (shouldComplete) {
        let subtasksToComplete = task.subtasks.filter(s => !s.registroId);
        if (task.subtasks.length === 0) {
          const newSub: any = await apiFetch("/tareas/", {
            method: "POST",
            body: JSON.stringify({
              actividad: task.id,
              nombre: "General",
              fecha_objetivo: new Date().toISOString().split('T')[0],
              horas_estimadas: 1
            })
          });
          subtasksToComplete = [{ id: newSub.id, horas_estimadas: 1 }];
        }
        await Promise.all(subtasksToComplete.map(s => 
          apiFetch("/registros/", {
            method: "POST",
            body: JSON.stringify({
              tarea: s.id,
              fecha: new Date().toISOString().split('T')[0],
              nota: "Actividad completada",
              horas_reales: s.horas_estimadas || 0
            }),
          })
        ));
        toast.dismiss();
        toast.success("Actividad completada");
      } else {
        const done = task.subtasks.filter(s => s.registroId);
        if (done.length > 0) {
          await Promise.all(done.map(s => apiFetch(`/registros/${s.registroId}/`, { method: "DELETE" })));
        }
        toast.dismiss();
        toast.info("Actividad pendiente");
      }
      loadTasks();
    } catch (e) {
      toast.dismiss();
      toast.error("Error al actualizar estado");
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const [actRaw, tareasRaw, registrosRaw]: any = await Promise.all([
        apiFetch("/actividades/"),
        apiFetch("/tareas/"),
        apiFetch("/registros/")
      ]);

      const listaActividades = Array.isArray(actRaw) ? actRaw : actRaw?.results ?? [];
      const listaTareas = Array.isArray(tareasRaw) ? tareasRaw : tareasRaw?.results ?? [];
      const listaRegistros = Array.isArray(registrosRaw) ? registrosRaw : registrosRaw?.results ?? [];

      const mapped: Task[] = listaActividades.map((act: any) => {
        const subtasks = listaTareas
          .filter((t: any) => t.actividad === act.id)
          .map((t: any) => {
            const registro = listaRegistros.find((r: any) => r.tarea === t.id);
            return { ...t, registroId: registro?.id || null };
          });
        const isCompleted = subtasks.length > 0 && subtasks.every((s: any) => !!s.registroId);

        return {
          id: act.id,
          title: act.titulo ?? "Sin título",
          project: act.curso ?? "Sin curso",
          priority: normalizePriority(act.prioridad),
          dueDate: formatDueDate(act.fecha_entrega),
          completed: isCompleted,
          tags: [act.tipo],
          subtasks: subtasks,
          description: act.descripcion || "",
        };
      });

      setTasks(mapped);
      if (selectedActivity) {
        const updated = mapped.find(m => m.id === selectedActivity.id);
        if (updated) setSelectedActivity(updated);
      }
    } catch (e) {
      setError("Error al sincronizar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [refreshKey]);

  const filteredTasks = useMemo(() => {
    const byStatus = filter === "all" ? tasks : filter === "completed" ? tasks.filter((t) => t.completed) : tasks.filter((t) => !t.completed)
    const q = query.trim().toLowerCase()
    if (!q) return byStatus
    return byStatus.filter((t) => `${t.title} ${t.project} ${t.tags.join(" ")}`.toLowerCase().includes(q))
  }, [filter, tasks, query])

  const total = tasks.length
  const totalActive = tasks.filter((t) => !t.completed).length
  const totalCompleted = tasks.filter((t) => t.completed).length

  if (loading) return <SkeletonTasks />
  if (error) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar tareas..." className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent"><Filter className="w-4 h-4" /> Filtro</Button>
          <Button variant="outline" className="gap-2 bg-transparent"><Calendar className="w-4 h-4" /> Fecha</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">Todos ({total})</Button>
        <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")} size="sm">Por hacer ({totalActive})</Button>
        <Button variant={filter === "completed" ? "default" : "outline"} onClick={() => setFilter("completed")} size="sm">Completado ({totalCompleted})</Button>
      </div>

      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tareas para mostrar.</p>
        ) : (
          filteredTasks.map((task, index) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              index={index} 
              onToggleActivity={handleToggleActivity}
              onToggleSubtask={handleToggleSubtask}
              onOpenManage={handleOpenManageDialog}
              onOpenEdit={handleOpenEditActivity}
              onDelete={handleDeleteActivity}
            />
          ))
        )}
      </div>

      <ManageTasksDialog 
        open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen} 
        activity={selectedActivity} onRefresh={loadTasks}
        onActivityUpdate={(updated) => {
          setSelectedActivity(updated);
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }}
      />
      <CreateActivityDialog open={isEditActivityOpen} onOpenChange={setIsEditActivityOpen} activity={activityToEdit} onCreated={loadTasks} />
    </div>
  )
}
