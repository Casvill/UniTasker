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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const TaskSchema = z.object({
    title: z.string().min(2, "El título es obligatorio (mínimo 2 caracteres)."),
    type: z.enum(["examen", "quiz", "taller", "proyecto", "otro"]),
    course: z.string().min(2, "El curso es obligatorio (mínimo 2 caracteres)."),
    eventDateTime: z.string().optional(), // datetime-local string o vacío
    dueDateTime: z.string().optional(),   // datetime-local string o vacío
})

type TaskFormValues = z.infer<typeof TaskSchema>

export function CreateTaskDialog() {
    const [open, setOpen] = React.useState(false)

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(TaskSchema),
        defaultValues: {
            title: "",
            type: "otro",
            course: "",
            eventDateTime: "",
            dueDateTime: "",
        },
        mode: "onTouched",
    })

    const { register, handleSubmit, setValue, watch, formState, reset } = form
    const { errors, isSubmitting } = formState

    const selectedType = watch("type")

    function normalizeOptional(v: string | undefined) {
        const trimmed = (v ?? "").trim()
        return trimmed.length ? trimmed : undefined
    }

    function toISOIfPresent(v?: string) {
        const t = (v ?? "").trim()
        return t ? new Date(t).toISOString() : undefined
    }

    const onSubmit = async (values: TaskFormValues) => {
        const payload = {
            title: values.title,
            type: values.type,
            course: values.course,
            // ⚠️ Ajusta estos nombres si tu backend usa otros:
            event_datetime: toISOIfPresent(values.eventDateTime),
            due_datetime: toISOIfPresent(values.dueDateTime),
        }

        try {
            await apiFetch("/actividades/", {
                method: "POST",
                body: JSON.stringify(payload),
            })

            toast.success("Tarea creada exitosamente.")
            reset()
            setOpen(false)
        } catch (e: any) {
            toast.error(e?.message ?? "No se pudo crear la tarea.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                    + Crear Tarea
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Nueva tarea</DialogTitle>
                    <DialogDescription>
                        Completa los campos mínimos para registrar tu actividad evaluativa.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Título */}
                    <div className="space-y-1.5">
                        <Label htmlFor="title">Título de actividad *</Label>
                        <Input id="title" placeholder="Ej: Parcial de Cálculo" {...register("title")} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>

                    {/* Tipo */}
                    <div className="space-y-1.5">
                        <Label>¿Como te van a evaluar? *</Label>
                        <Select
                            value={selectedType}
                            onValueChange={(v) => setValue("type", v as TaskFormValues["type"], { shouldValidate: true })}
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

                    {/* Curso */}
                    <div className="space-y-1.5">
                        <Label htmlFor="course">Curso *</Label>
                        <Input id="course" placeholder="Ej: Matemáticas II" {...register("course")} />
                        {errors.course && <p className="text-sm text-destructive">{errors.course.message}</p>}
                    </div>

                    {/* Fecha/hora del evento */}
                    <div className="space-y-1.5">
                        <Label htmlFor="eventDateTime">Fecha/hora del evento (opcional)</Label>
                        <Input id="eventDateTime" type="datetime-local" {...register("eventDateTime")} />
                    </div>

                    {/* Fecha límite */}
                    <div className="space-y-1.5">
                        <Label htmlFor="dueDateTime">Fecha límite (opcional)</Label>
                        <Input id="dueDateTime" type="datetime-local" {...register("dueDateTime")} />
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