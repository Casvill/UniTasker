"use client"
// Importaciones de Shadcn UI
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  AlertCircle,
  Pencil,
  Settings2,
  Trash2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { CreateTaskDialog, ManageTasksDialog } from "./create-task-dialog"


type Task = {
  id: number
  title: string
  project: string
  priority: "High" | "Medium" | "Low"
  dueDate: string
  completed: boolean
  tags: string[]
  subtasks: any[]
  description: string
}

function SkeletonTasks() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-5 w-5 mt-1 rounded" />
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="mt-3 space-y-2 border-t pt-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

type TasksContentProps = {
  refreshKey: number
}

function normalizePriority(value: any): Task["priority"] {
  const v = String(value ?? "").toLowerCase()
  if (v === "high" || v === "alta" || v === "alto") return "High"
  if (v === "low" || v === "baja" || v === "bajo") return "Low"
  return "Medium"
}

function formatDueDate(value: any): string {
  if (!value) return "Sin fecha"

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-")
    return `${d}/${m}/${y}`
  }

  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString()

  return String(value)
}

export function TasksContent({ refreshKey }: TasksContentProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  
  // Estados para el diálogo de gestión de tareas
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Estados para el diálogo de edición de actividad
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
      await apiFetch(`/actividades/${taskId}/`, {
        method: "DELETE",
      });
      toast.success("Actividad eliminada");
      loadTasks();
    } catch (error) {
      console.error("Error al eliminar actividad:", error);
      toast.error("No se pudo eliminar la actividad");
    }
  };

// Función para cambiar estado de subtarea usando RegistroAvance como marcador
const handleToggleSubtask = async (activityId: number, subtaskId: number) => {
  const targetTask = tasks.find(t => t.id === activityId);
  if (!targetTask) return;

  const subtask = targetTask.subtasks.find((s: any) => s.id === subtaskId);
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

// Función para alternar el estado de toda una actividad
const handleToggleActivity = async (task: Task) => {
  const shouldComplete = !task.completed;
  
  try {
    toast.loading(shouldComplete ? "Completando..." : "Actualizando...");
    
    if (shouldComplete) {
      let subtasksToComplete = task.subtasks.filter(s => !s.registroId);
      
      // Caso: Actividad sin tareas -> Creamos una tarea por defecto para poder marcarla
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
        await Promise.all(done.map(s => 
          apiFetch(`/registros/${s.registroId}/`, { method: "DELETE" })
        ));
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
      console.error("Error al cargar tareas:", e);
      setError("Error al sincronizar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [refreshKey]);

  const filteredTasks = useMemo(() => {
    const byStatus =
      filter === "all"
        ? tasks
        : filter === "completed"
          ? tasks.filter((t) => t.completed)
          : tasks.filter((t) => !t.completed)

    const q = query.trim().toLowerCase()
    if (!q) return byStatus

    return byStatus.filter((t) => {
      const haystack = `${t.title} ${t.project} ${t.tags.join(" ")}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [filter, tasks, query])

  const total = tasks.length
  const totalActive = tasks.filter((t) => !t.completed).length
  const totalCompleted = tasks.filter((t) => t.completed).length

  if (loading) {
    return <SkeletonTasks />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filtro
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Calendar className="w-4 h-4" />
            Fecha
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">
          Todos ({total})
        </Button>
        <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")} size="sm">
          Por hacer ({totalActive})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
          size="sm"
        >
          Completado ({totalCompleted})
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">No hay tareas para mostrar.</p>
          </Card>
        ) : (
          filteredTasks.map((task, index) => (
            <Card
              key={task.id}
              className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-in"
              onClick={() => handleOpenManageDialog(task)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <Checkbox 
                  checked={task.completed} 
                  onCheckedChange={() => handleToggleActivity(task)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1" 
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`font-semibold text-foreground ${task.completed ? "line-through opacity-60" : ""}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => handleOpenEditActivity(e, task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteActivity(e, task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Badge
                        variant={
                          task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"
                        }
                        className="shrink-0"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {task.project}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {task.dueDate}
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {task.subtasks?.filter((s: any) => s.nombre !== "General").map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between group/sub">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={!!sub.registroId} 
                            onCheckedChange={() => handleToggleSubtask(task.id, sub.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3.5 w-3.5"
                          />
                          <span className={`text-xs ${!!sub.registroId ? "line-through opacity-50" : "text-foreground/80"}`}>
                            {sub.nombre}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground opacity-0 group-hover/sub:opacity-100 transition-opacity">
                          {sub.horas_estimadas}h
                        </span>
                      </div>
                    ))}
                    
                    {/* Validación para cuando no hay tareas (ignorando la tarea oculta 'General') */}
                    {(!task.subtasks || task.subtasks.filter((s: any) => s.nombre !== "General").length === 0) && (
                      <p className="text-[10px] italic text-muted-foreground">
                        Sin tareas asignadas
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ManageTasksDialog 
        open={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        activity={selectedActivity}
        onRefresh={loadTasks}
        onActivityUpdate={(updated) => {
          setSelectedActivity(updated);
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }}
      />

      <CreateTaskDialog 
        open={isEditActivityOpen}
        onOpenChange={setIsEditActivityOpen}
        activity={activityToEdit}
        onCreated={loadTasks}
      />
    </div>
  )
}
