import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Tag, Calendar } from "lucide-react"
import { Activity } from "./task-types"

interface TaskCardProps {
  task: Activity
  index: number
  onToggleActivity: (activity: Activity) => void
  onToggleSubtask: (activityId: number, taskId: number) => void
  onOpenManage: (activity: Activity) => void
  onOpenEdit: (e: React.MouseEvent, activity: Activity) => void
  onDelete: (e: React.MouseEvent, activityId: number) => void
}

export function TaskCard({ 
  task, 
  index, 
  onToggleActivity, 
  onToggleSubtask, 
  onOpenManage, 
  onOpenEdit, 
  onDelete 
}: TaskCardProps) {
  return (
    <Card
      className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-in"
      onClick={() => onOpenManage(task)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-2 ">
        <Checkbox 
          checked={task.completed} 
          onCheckedChange={() => onToggleActivity(task)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 h-5 w-5" 
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className={`text-lg font-semibold text-foreground ${task.completed ? "line-through opacity-60" : ""}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground "
                onClick={(e) => onOpenEdit(e, task)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground "
                onClick={(e) => onDelete(e, task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="flex gap-2 flex-wrap">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="default" className="shrink-0 text-sm">
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              {task.project}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {task.dueDate}
            </span>
          </div>

          <div className="mt-3 space-y-2 border-t pt-3">
            {task.tasks?.filter((t: any) => t.title !== "General").map((t: any) => (
              <div key={t.id} className="flex items-center justify-between group/sub">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={t.completed} 
                    onCheckedChange={() => onToggleSubtask(task.id, t.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 rounded-full"
                  />
                  <span className={`text-sm ${t.completed ? "line-through opacity-50" : "text-foreground/80"}`}>
                    {t.title}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover/sub:opacity-100 transition-opacity">
                  {t.estimatedHours}h
                </span>
              </div>
            ))}
            
            {(!task.tasks || task.tasks.filter((t: any) => t.title !== "General").length === 0) && (
              <p className="text-sm italic text-muted-foreground">
                ¡Agrega tareas a esta actividad! 
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
