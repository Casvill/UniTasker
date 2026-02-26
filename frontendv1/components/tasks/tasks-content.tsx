"use client"
// Importaciones de Shadcn UI
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  PlusCircle, 
  Trash2, 
  Clock,
  CheckCircle2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, Calendar, Tag } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api"


type Task = {
  id: number
  title: string
  project: string
  priority: "High" | "Medium" | "Low"
  dueDate: string
  completed: boolean
  tags: string[]
  subtasks: any[] // <--- Agrega esta línea
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
  //lógica para on click
  const [isSheetOpen, setIsSheetOpen] = useState();
  const [selectedActivity, setSelectedActivity] = useState(null);
  // 2. Función para abrir el CRUD
  const handleOpenCrud = (actividad) => {
    setSelectedActivity(actividad); // Guardamos la info de la actividad
    setIsSheetOpen(true);           // Abrimos el Sheet
  };
  const [newSubtask, setNewSubtask] = useState({
  nombre: "",
  fecha: "",
  horas: ""
  });
  // 2. Función para CREAR la subtarea
const handleCreateSubtask = async () => {
  if (!newSubtask.nombre.trim() || !selectedActivity) return;

  try {
    // 2. Preparamos lo que vamos a enviar al servidor
    const body = {
      nombre: newSubtask.nombre,
      fecha_objetivo: newSubtask.fecha || null,
      horas_estimadas: parseFloat(newSubtask.horas) || 0,
      actividad: selectedActivity.id, // Esto lo vincula a la actividad del Dialog
      estado: "pendiente"
    };

    // 3. Hacemos la petición (el await ahora sí funcionará)
    const response = await apiFetch("/tareas/", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (response) {
      // 4. Actualizamos el Dialog (selectedActivity)
      setSelectedActivity((prev: any) => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), response]
      }));

      // 4.1 Actualizamos la lista principal (tasks)
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === selectedActivity.id) {
            const updatedSubtasks = [...(task.subtasks || []), response];
            return {
              ...task,
              subtasks: updatedSubtasks,
              completed: updatedSubtasks.length > 0 && updatedSubtasks.every((t: any) => t.estado === "hecha"),
            };
          }
          return task;
        })
      );

      // 5. Limpiamos los campos del formulario
      setNewSubtask({ nombre: "", fecha: "", horas: "" });
    }
  } catch (error) {
    console.error("Error al guardar la subtarea:", error);
  }
}; 
  
  

// 3. Función para ELIMINAR la subtarea
const handleDeleteSubtask = async (id: string | number) => {
  if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;

  try {
    await apiFetch(`/tareas/${id}/`, {
      method: "DELETE",
    });

    // 1. Actualizar el Dialog (selectedActivity)
    setSelectedActivity((prev: any) => {
      if (!prev) return prev;
      const updatedSubtasks = (prev.subtasks || []).filter((s: any) => s.id !== id);
      return {
        ...prev,
        subtasks: updatedSubtasks,
      };
    });

    // 2. Actualizar la lista principal (tasks)
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.subtasks.some((s) => s.id === id)) {
          const updatedSubtasks = task.subtasks.filter((s) => s.id !== id);
          return {
            ...task,
            subtasks: updatedSubtasks,
            completed: updatedSubtasks.length > 0 && updatedSubtasks.every((t: any) => t.estado === "hecha"),
          };
        }
        return task;
      })
    );
  } catch (error) {
    console.error("Error al eliminar la subtarea:", error);
    alert("No se pudo eliminar la tarea.");
  }
};

// 4. Función para cambiar ESTADO
const handleToggleSubtask = async (id: string | number) => {
  try {
    let subtask: any = null;
    
    if (selectedActivity?.subtasks) {
      subtask = selectedActivity.subtasks.find((s: any) => s.id === id);
    }
    
    if (!subtask) {
      for (const t of tasks) {
        const found = t.subtasks.find((s: any) => s.id === id);
        if (found) {
          subtask = found;
          break;
        }
      }
    }

    if (!subtask) return;

    const newEstado = subtask.estado === "hecha" ? "pendiente" : "hecha";

    const response = await apiFetch(`/tareas/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ estado: newEstado }),
    });

    if (response) {
      setSelectedActivity((prev: any) => {
        if (!prev) return prev;
        const updatedSubtasks = (prev.subtasks || []).map((s: any) =>
          s.id === id ? response : s
        );
        return {
          ...prev,
          subtasks: updatedSubtasks,
        };
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.subtasks.some((s) => s.id === id)) {
            const updatedSubtasks = task.subtasks.map((s) =>
              s.id === id ? response : s
            );
            return {
              ...task,
              subtasks: updatedSubtasks,
              completed: updatedSubtasks.length > 0 && updatedSubtasks.every((t: any) => t.estado === "hecha"),
            };
          }
          return task;
        })
      );
    }
  } catch (error) {
    console.error("Error al cambiar el estado de la tarea:", error);
  }
};

// 5. Función para marcar todas las subtareas como hechas
const handleMarkAllAsDone = async () => {
  if (!selectedActivity || !selectedActivity.subtasks) return;

  const pendingSubtasks = selectedActivity.subtasks.filter((s: any) => s.estado !== "hecha");
  if (pendingSubtasks.length === 0) return;

  try {
    const updatedSubtasksPromises = pendingSubtasks.map((s: any) =>
      apiFetch(`/tareas/${s.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ estado: "hecha" }),
      })
    );

    const responses = await Promise.all(updatedSubtasksPromises);

    // 1. Actualizar el Dialog (selectedActivity)
    setSelectedActivity((prev: any) => {
      const updatedSubtasks = (prev.subtasks || []).map((s: any) => {
        const found = responses.find((r: any) => r.id === s.id);
        return found || s;
      });
      return { ...prev, subtasks: updatedSubtasks };
    });

    // 2. Actualizar la lista principal (tasks)
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === selectedActivity.id) {
          const updatedSubtasks = task.subtasks.map((s) => {
            const found = responses.find((r: any) => r.id === s.id);
            return found || s;
          });
          return {
            ...task,
            subtasks: updatedSubtasks,
            completed: true,
          };
        }
        return task;
      })
    );
  } catch (error) {
    console.error("Error al marcar todas las tareas como hechas:", error);
  }
};

// 6. Función para alternar el estado de toda una actividad (y todas sus subtasks)
const handleToggleActivity = async (task: Task) => {
  const newCompleted = !task.completed;
  const newEstado = newCompleted ? "hecha" : "pendiente";

  try {
    // Si la actividad no tiene subtasks, no hay nada que marcar en el backend (por ahora)
    // pero actualizamos el estado local para consistencia visual si fuera necesario.
    if (task.subtasks.length === 0) return;

    const updatedSubtasksPromises = task.subtasks.map((s: any) =>
      apiFetch(`/tareas/${s.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ estado: newEstado }),
      })
    );

    const responses = await Promise.all(updatedSubtasksPromises);

    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === task.id) {
          const updatedSubtasks = t.subtasks.map((s) => {
            const found = responses.find((r: any) => r.id === s.id);
            return found || { ...s, estado: newEstado }; // Fallback
          });
          return {
            ...t,
            subtasks: updatedSubtasks,
            completed: newCompleted,
          };
        }
        return t;
      })
    );
  } catch (error) {
    console.error("Error al cambiar el estado de la actividad:", error);
  }
};

  useEffect(() => {
  async function loadTasks() {
    try {
      setLoading(true);
      // 1. Traemos las actividades (ahora vienen sin tareas)
      const actividadesRaw: any = await apiFetch("/actividades/", { method: "GET" });
      const listaActividades = Array.isArray(actividadesRaw) ? actividadesRaw : actividadesRaw?.results ?? [];

      // 2. Por cada actividad, disparamos la petición con el query param
      const mapped: Task[] = await Promise.all(listaActividades.map(async (act: any) => {
        // AQUÍ USAS TU NUEVA URL CON QUERY PARAM
        const tareasActividad: any = await apiFetch(`/tareas/?actividad=${act.id}`, { method: "GET" });
        const subtasks = Array.isArray(tareasActividad) ? tareasActividad : tareasActividad?.results ?? [];

        return {
          id: act.id,
          title: act.titulo ?? "Sin título",
          project: act.curso ?? "Sin curso",
          priority: normalizePriority(act.prioridad),
          dueDate: formatDueDate(act.fecha_entrega),
          // Ahora calculamos el completado basado en los nuevos datos
          completed: subtasks.length > 0 && subtasks.every((t: any) => t.estado === "hecha"),
          tags: [act.tipo],
          subtasks: subtasks, // Guardamos las tareas obtenidas por el query param
        };
      }));

      setTasks(mapped);
    } catch (e) {
      setError("Error al sincronizar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

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
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Cargando tareas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <p className="text-sm text-red-500">{error}</p>
        </Card>
      </div>
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
              onClick={() => handleOpenCrud(task)}
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
                    <Badge
                      variant={
                        task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"
                      }
                      className="shrink-0"
                    >
                      {task.priority}
                    </Badge>
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
                    {task.subtasks?.map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between group/sub">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={sub.estado === "hecha"} 
                            onCheckedChange={() => handleToggleSubtask(sub.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3.5 w-3.5"
                          />
                          <span className={`text-xs ${sub.estado === "hecha" ? "line-through opacity-50" : "text-foreground/80"}`}>
                            {sub.nombre}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground opacity-0 group-hover/sub:opacity-100 transition-opacity">
                          {sub.horas_estimadas}h
                        </span>
                      </div>
                    ))}
                    
                    {/* Validación para cuando no hay tareas */}
                    {(!task.subtasks || task.subtasks.length === 0) && (
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

<Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
  <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
    
    {/* CABECERA */}
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
        <p className="font-bold text-slate-700">{selectedActivity?.title}</p>
        <p className="text-sm text-muted-foreground">{selectedActivity?.project}</p>
      </div>
    </DialogHeader>

<div className="p-4 pt-0 space-y-2"> 
      
      {/* SECCIÓN: Formulario */}
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

          <Button
            onClick={handleCreateSubtask}
          >
            Guardar Tarea
          </Button>
        </div>
      </section>

      {/* SECCIÓN: Listado de tareas actuales */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Tareas Actuales</h3>
        <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {selectedActivity?.subtasks?.length > 0 ? (
            selectedActivity.subtasks.map((sub: any) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-[#00682b]/30 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={sub.estado === "hecha"}
                    onCheckedChange={() => handleToggleSubtask(sub.id)}
                    className="rounded-full border-slate-300 data-[state=checked]:bg-[#00682b] data-[state=checked]:border-[#00682b]"
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-semibold ${
                        sub.estado === "hecha" ? "line-through text-slate-400" : "text-slate-700"
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

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSubtask(sub.id)}
                  className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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

    </div>
  )
}
