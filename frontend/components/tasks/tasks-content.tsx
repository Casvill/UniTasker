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
import { Activity, normalizePriority, formatDueDate } from "./task-types"

type TasksContentProps = {
  refreshKey: number
}

export function TasksContent({ refreshKey }: TasksContentProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);

  const handleOpenManageDialog = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsManageDialogOpen(true);
  };

  const handleOpenEditActivity = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    setActivityToEdit(activity);
    setIsEditActivityOpen(true);
  };

  const handleDeleteActivity = async (e: React.MouseEvent, activityId: number) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta actividad?")) return;

    try {
      await apiFetch(`/actividades/${activityId}/`, { method: "DELETE" });
      toast.success("Actividad eliminada");
      loadActivities();
    } catch (error) {
      toast.error("No se pudo eliminar la actividad");
    }
  };

  const handleToggleTask = async (activityId: number, taskId: number) => {
    const targetActivity = activities.find(a => a.id === activityId);
    if (!targetActivity) return;
    const task = targetActivity.tasks.find((t: any) => t.id === taskId);
    if (!task) return;

    try {
      if (!!task.registrationId) {
        await apiFetch(`/registros/${task.registrationId}/`, { method: "DELETE" });
        toast.info("Tarea marcada como pendiente");
      } else {
        await apiFetch("/registros/", {
          method: "POST",
          body: JSON.stringify({
            tarea: taskId,
            fecha: new Date().toISOString().split('T')[0],
            nota: "Completada",
            horas_reales: task.estimatedHours || 0
          }),
        });
        toast.success("Tarea completada");
      }
      loadActivities();
    } catch (error) {
      toast.error("Error al sincronizar con el servidor");
    }
  };

  const handleToggleActivity = async (activity: Activity) => {
    const shouldComplete = !activity.completed;
    try {
      toast.loading(shouldComplete ? "Completando..." : "Actualizando...");
      if (shouldComplete) {
        let tasksToComplete = activity.tasks.filter(t => !t.registrationId);
        if (activity.tasks.length === 0) {
          const newTask: any = await apiFetch("/tareas/", {
            method: "POST",
            body: JSON.stringify({
              actividad: activity.id,
              nombre: "General",
              fecha_objetivo: new Date().toISOString().split('T')[0],
              horas_estimadas: 1
            })
          });
          tasksToComplete = [{ id: newTask.id, estimatedHours: 1 } as any];
        }
        await Promise.all(tasksToComplete.map(t => 
          apiFetch("/registros/", {
            method: "POST",
            body: JSON.stringify({
              tarea: t.id,
              fecha: new Date().toISOString().split('T')[0],
              nota: "Actividad completada",
              horas_reales: t.estimatedHours || 0
            }),
          })
        ));
        toast.dismiss();
        toast.success("Actividad completada");
      } else {
        const done = activity.tasks.filter(t => t.registrationId);
        if (done.length > 0) {
          await Promise.all(done.map(t => apiFetch(`/registros/${t.registrationId}/`, { method: "DELETE" })));
        }
        toast.dismiss();
        toast.info("Actividad pendiente");
      }
      loadActivities();
    } catch (e) {
      toast.dismiss();
      toast.error("Error al actualizar estado");
    }
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const [actRaw, tasksRaw, regsRaw]: any = await Promise.all([
        apiFetch("/actividades/"),
        apiFetch("/tareas/"),
        apiFetch("/registros/")
      ]);

      const activitiesList = Array.isArray(actRaw) ? actRaw : actRaw?.results ?? [];
      const tasksList = Array.isArray(tasksRaw) ? tasksRaw : tasksRaw?.results ?? [];
      const regsList = Array.isArray(regsRaw) ? regsRaw : regsRaw?.results ?? [];

      const mapped: Activity[] = activitiesList.map((act: any) => {
        const tasks = tasksList
          .filter((t: any) => t.actividad === act.id)
          .map((t: any) => {
            const reg = regsList.find((r: any) => r.tarea === t.id);
            return { 
              id: t.id,
              title: t.nombre,
              dueDate: t.fecha_objetivo,
              estimatedHours: t.horas_estimadas,
              completed: !!reg,
              registrationId: reg?.id || null 
            };
          });
        const isCompleted = tasks.length > 0 && tasks.every((t: any) => t.completed);

        return {
          id: act.id,
          title: act.titulo ?? "Sin título",
          project: act.curso ?? "Sin curso",
          priority: normalizePriority(act.prioridad),
          dueDate: formatDueDate(act.fecha_entrega),
          completed: isCompleted,
          tags: [act.tipo],
          tasks: tasks,
          description: act.descripcion || "",
        };
      });

      setActivities(mapped);
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
    loadActivities();
  }, [refreshKey]);

  const filteredActivities = useMemo(() => {
    const byStatus = filter === "all" ? activities : filter === "completed" ? activities.filter((a) => a.completed) : activities.filter((a) => !a.completed)
    const q = query.trim().toLowerCase()
    if (!q) return byStatus
    return byStatus.filter((a) => `${a.title} ${a.project} ${a.tags.join(" ")}`.toLowerCase().includes(q))
  }, [filter, activities, query])

  const total = activities.length
  const totalActive = activities.filter((a) => !a.completed).length
  const totalCompleted = activities.filter((a) => a.completed).length

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
        <CreateActivityDialog onCreated={loadActivities} />
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar actividades..." className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
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
        {filteredActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay actividades para mostrar.</p>
        ) : (
          filteredActivities.map((activity, index) => (
            <TaskCard 
              key={activity.id} 
              task={activity} 
              index={index} 
              onToggleActivity={handleToggleActivity}
              onToggleSubtask={handleToggleTask}
              onOpenManage={handleOpenManageDialog}
              onOpenEdit={handleOpenEditActivity}
              onDelete={handleDeleteActivity}
            />
          ))
        )}
      </div>

      <ManageTasksDialog 
        open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen} 
        activity={selectedActivity} onRefresh={loadActivities}
        onActivityUpdate={(updated) => {
          setSelectedActivity(updated);
          setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
        }}
      />
      <CreateActivityDialog open={isEditActivityOpen} onOpenChange={setIsEditActivityOpen} activity={activityToEdit} onCreated={loadActivities} showTrigger={false} />
    </div>
  )
}
