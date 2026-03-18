"use client"

import { useState, useRef } from "react"
import { CalendarDays, Clock3, CalendarClock, RotateCcw, ChevronDown, ChevronUp } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Subtask } from "@/components/today/today-board"
import { ReprogramTaskDialog } from "@/components/today/reprogram-task-dialog"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
type Variant = "overdue" | "today" | "upcoming"

function formatDate(dateString?: string | null) {
    if (!dateString) return "Sin fecha"

    const [year, month, day] = dateString.split("-")
    if (!year || !month || !day) return dateString

    return `${day}/${month}/${year}`
}

function getTodayString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function diffInDays(targetDate: string, baseDate: string) {
    const [ty, tm, td] = targetDate.split("-").map(Number)
    const [by, bm, bd] = baseDate.split("-").map(Number)

    const target = new Date(ty, tm - 1, td)
    const base = new Date(by, bm - 1, bd)

    const msPerDay = 1000 * 60 * 60 * 24
    return Math.round((target.getTime() - base.getTime()) / msPerDay)
}

function getDateLabel(targetDate: string, variant: Variant) {
    const today = getTodayString()
    const diff = diffInDays(targetDate, today)

    if (variant === "overdue") {
        const days = Math.abs(diff)
        if (days === 0) return "Venció hoy"
        if (days === 1) return "Venció hace 1 día"
        return `Venció hace ${days} días`
    }

    if (variant === "today") {
        return "Para hoy"
    }

    return formatDate(targetDate)
}

export function TodayTaskCard({
    task,
    variant,
    onToggle,
    onTaskUpdated,
}: {
    task: Subtask
    variant: Variant
    onToggle: () => void
    onTaskUpdated: () => Promise<void> | void
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const dateLabel = getDateLabel(task.target_date, variant)
    const isChecked = task.status === "finalizado"

    const [isPostponeOpen, setIsPostponeOpen] = useState(false)
    const [postponeNote, setPostponeNote] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const [showActions, setShowActions] = useState(false)
    const [actionsAnim, setActionsAnim] = useState<"fade-in-up" | "fade-out-up" | "fade-in-down">("fade-in-up")

    function handleToggleActions() {
    if (showActions) {
        setActionsAnim("fade-out-up")
        setTimeout(() => setShowActions(false), 350) // Duración de la animación
    } else {
        setShowActions(true)
        setActionsAnim("fade-in-down")
    }
    }

    return (
        <>
            <article
                className={cn(
                    "relative rounded-2xl border bg-background p-4 shadow-sm transition hover:shadow-md",
                    variant === "overdue" && "border-destructive/20",
                    variant === "today" && "border-amber-500/20",
                    variant === "upcoming" && "border-blue-500/20",
                    isChecked && "opacity-75"
                )}
                >
                <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute top-3 right-3 text-muted-foreground hover:text-primary z-10"
                aria-label={showActions ? "Ocultar acciones" : "Mostrar acciones"}
                onClick={handleToggleActions}
                >
                {showActions ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                </Button>

                {(showActions || actionsAnim === "fade-out-up") && (
                    <div
                        className={cn(
                        "absolute right-3 top-14 flex flex-col gap-2 z-20",
                        actionsAnim,
                        !showActions && "pointer-events-none"
                        )}
                    >
                    <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => setIsDialogOpen(true)}
                            aria-label="Reprogramar subtarea"
                        >
                            <CalendarClock className="h-5 w-5" />
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" align="center">
                        Reprogramar
                        </TooltipContent>
                    </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                    <Popover open={isPostponeOpen} onOpenChange={setIsPostponeOpen}>
                        <Tooltip>
                        <PopoverTrigger asChild>
                            <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="text-muted-foreground hover:text-primary"
                                aria-label="Posponer subtarea"
                                onClick={() => setIsPostponeOpen(true)}
                            >
                                <RotateCcw className="h-5 w-5" />
                            </Button>
                            </TooltipTrigger>
                        </PopoverTrigger>
                        <TooltipContent side="left" align="center">
                            Posponer
                        </TooltipContent>
                        </Tooltip>
                        <PopoverContent
                        side="bottom"
                        align="center"
                        sideOffset={8}
                        className="w-64 p-4"
                        onOpenAutoFocus={() => inputRef.current?.focus()}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                        <div className="mb-2 font-medium text-foreground">¿Por qué pospones?</div>
                        <Input
                            ref={inputRef}
                            type="text"
                            className="w-full text-sm mb-2"
                            placeholder="Agrega una nota (opcional)"
                            value={postponeNote}
                            onChange={e => setPostponeNote(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                            className="flex-1"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setIsPostponeOpen(false)
                                setPostponeNote("")
                            }}
                            >
                            Cancelar
                            </Button>
                            <Button
                            className="flex-1"
                            size="sm"
                            onClick={() => {
                                setIsPostponeOpen(false)
                                setPostponeNote("")
                            }}
                            >
                            Posponer
                            </Button>
                        </div>
                        </PopoverContent>
                    </Popover>
                    </TooltipProvider>
                </div>
                )}

                <div className="flex items-start gap-3">
                    <Checkbox
                        checked={isChecked}
                        onCheckedChange={onToggle}
                        className="mt-0.5 h-5 w-5"
                        aria-label={`Marcar ${task.title} como finalizada`}
                    />

                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="space-y-1">
                            <h4
                                className={cn(
                                    "text-base font-semibold leading-snug text-foreground",
                                    isChecked && "line-through text-muted-foreground"
                                )}
                            >
                                {task.title || "Subtarea sin título"}
                            </h4>

                            <p className="text-sm text-muted-foreground">
                                {task.actividad_title || "Actividad sin título"}
                            </p>

                            <p className="text-xs text-muted-foreground">
                                {task.course || "Sin curso"}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock3 className="h-4 w-4" />
                                <span>
                                    {task.estimated_effort == null
                                        ? "Esfuerzo no definido"
                                        : `Esfuerzo: ${task.estimated_effort}h`}
                                </span>
                            </div>

                            <div
                                className={cn(
                                    "flex items-center gap-2 font-medium",
                                    variant === "overdue" && "text-destructive",
                                    variant === "today" && "text-amber-700 dark:text-amber-400",
                                    variant === "upcoming" && "text-blue-700 dark:text-blue-400"
                                )}
                            >
                                <CalendarDays className="h-4 w-4" />
                                <span>{dateLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            <ReprogramTaskDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                taskId={task.id}
                taskTitle={task.title}
                activityTitle={task.actividad_title}
                currentDate={task.target_date}
                currentEffort={task.estimated_effort ?? 0}
                onSaved={onTaskUpdated}
            />
        </>
    )
}