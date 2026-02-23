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
    type: z.enum(["examen", "quiz", "taller", "proyecto", "otro"]).default("otro"),
    course: z.string().min(2, "El curso es obligatorio (mínimo 2 caracteres)."),
    dueDate: z.string().min(1, "La fecha de entrega es obligatoria."), // YYYY-MM-DD
    description: z.string().optional(),
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
            dueDate: "",
            description: "",
        },
        mode: "onTouched",
    })

    const { register, handleSubmit, setValue, watch, formState, reset } = form
    const { errors, isSubmitting } = formState
    const selectedType = watch("type")

    const onSubmit = async (values: TaskFormValues) => {
        const payload = {
            titulo: values.title.trim(),
            tipo: values.type,
            curso: values.course.trim(),
            fecha_entrega: values.dueDate, // DateField => "YYYY-MM-DD"
            descripcion: (values.description ?? "").trim(),
        }

        try {
            await apiFetch("/actividades/", {
                method: "POST",
                body: JSON.stringify(payload),
            })

            toast.success("Actividad creada exitosamente.")
            reset()
            setOpen(false)
        } catch (e: any) {
            toast.error(e?.message ?? "No se pudo crear la actividad.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                    + Crear Actividad
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Nueva actividad</DialogTitle>
                    <DialogDescription>
                        Completa los campos mínimos para registrar tu actividad evaluativa.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Título */}
                    <div className="space-y-1.5">
                        <Label htmlFor="title">Título de actividad *</Label>
                        <Input
                            id="title"
                            placeholder="Ej: Parcial de Cálculo"
                            {...register("title")}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Tipo */}
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
                        {errors.type && (
                            <p className="text-sm text-destructive">{errors.type.message}</p>
                        )}
                    </div>

                    {/* Curso */}
                    <div className="space-y-1.5">
                        <Label htmlFor="course">Curso *</Label>
                        <Input
                            id="course"
                            placeholder="Ej: Matemáticas II"
                            {...register("course")}
                        />
                        {errors.course && (
                            <p className="text-sm text-destructive">{errors.course.message}</p>
                        )}
                    </div>

                    {/* Fecha de entrega (DateField => date) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="dueDate">Fecha de entrega *</Label>
                        <Input id="dueDate" type="date" {...register("dueDate")} />
                        {errors.dueDate && (
                            <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                        )}
                    </div>

                    {/* Descripción (opcional) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description">Descripción (opcional)</Label>
                        <Input
                            id="description"
                            placeholder="Ej: Temas 1-3, llevar calculadora"
                            {...register("description")}
                        />
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