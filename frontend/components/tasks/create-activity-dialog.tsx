"use client"

import * as React from "react"
import { apiFetch } from "@/lib/api"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ActivitySchema, ActivityFormValues } from "./task-schema"

type CreateActivityDialogProps = {
    onCreated?: () => void
    activity?: any
    open?: boolean
    onOpenChange?: (open: boolean) => void
    showTrigger?: boolean
}

export function CreateActivityDialog({ onCreated, activity, open: controlledOpen, onOpenChange, showTrigger = true }: CreateActivityDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const open = controlledOpen ?? internalOpen
    const setOpen = onOpenChange ?? setInternalOpen

    const minDate = React.useMemo(() => {
        const d = new Date()
        d.setDate(d.getDate())
        return d.toISOString().split("T")[0]
    }, [])

    const form = useForm<ActivityFormValues>({
        resolver: zodResolver(ActivitySchema),
        defaultValues: {
            title: activity?.title || "",
            type: activity?.tags?.[0] || "otro",
            course: activity?.project || "",
            dueDate: activity?.dueDate ? (activity.dueDate.includes('/') ? activity.dueDate.split('/').reverse().join('-') : activity.dueDate) : "",
            description: activity?.description || "",
        },
        mode: "onTouched",
    })

    const { register, handleSubmit, setValue, watch, formState, reset } = form
    const { errors, isSubmitting } = formState
    const selectedType = watch("type")

    React.useEffect(() => {
        if (activity) {
            reset({
                title: activity.title,
                type: activity.tags?.[0] || "otro",
                course: activity.project,
                dueDate: activity.dueDate ? (activity.dueDate.includes('/') ? activity.dueDate.split('/').reverse().join('-') : activity.dueDate) : "",
                description: activity.description || "",
            })
        }
    }, [activity, reset])

    const onSubmit = async (values: ActivityFormValues) => {
        const payload = {
            titulo: values.title.trim(),
            tipo: values.type,
            curso: values.course.trim(),
            fecha_entrega: values.dueDate,
            descripcion: (values.description ?? "").trim(),
        }

        try {
            if (activity?.id) {
                await apiFetch(`/actividades/${activity.id}/`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                })
                toast.success("Actividad actualizada exitosamente.")
            } else {
                await apiFetch("/actividades/", {
                    method: "POST",
                    body: JSON.stringify(payload),
                })
                toast.success("Actividad creada exitosamente.")
            }
            onCreated?.()
            reset()
            setOpen(false)
        } catch (e: any) {
            toast.error(e?.message ?? "No se pudo guardar la actividad.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {showTrigger && !activity && (
                <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                        + Crear Actividad
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>{activity ? "Editar actividad" : "Nueva actividad"}</DialogTitle>
                    <DialogDescription>
                        {activity ? "Modifica los campos de tu actividad." : "A continuación, ingresa los detalles de tu nueva actividad."}
                    </DialogDescription>
                </DialogHeader>

                <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="title">¿Que es la actividad? *</Label>
                        <Input id="title" placeholder="Ej: Parcial de Cálculo" {...register("title")} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>¿Cómo te van a evaluar? *</Label>
                        <Select
                            value={selectedType}
                            onValueChange={(v) => setValue("type", v as ActivityFormValues["type"], { shouldValidate: true })}
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

                    <div className="space-y-1.5">
                        <Label htmlFor="course">¿A qué curso pertenece? *</Label>
                        <Input id="course" placeholder="Ej: Matemáticas II" {...register("course")} />
                        {errors.course && <p className="text-sm text-destructive">{errors.course.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="dueDate">¿Cuándo es la entrega? *</Label>
                        <Input id="dueDate" type="date" min={minDate} {...register("dueDate")} />
                        {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description">¿Qué detalles adicionales deseas agregar? </Label>
                        <Input id="description" placeholder="Ej: Temas 1-3, llevar calculadora" {...register("description")} />
                    </div>

                    <DialogFooter className="gap-3 sm:gap-2">
                        <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="flex-1">
                            {isSubmitting ? "Guardando..." : "Guardar Actividad"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
