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
import { ActivitySchema, ActivityFormValues } from "./activity-schema"
import { Loader2 } from "lucide-react"

type CreateActivityDialogProps = {
    onCreated?: (result?: any) => void
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
            type: activity?.tags?.[0] || "",
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
    if (!open) {
        reset({
        title: activity?.title || "",
        type: activity?.tags?.[0] || "",
        course: activity?.project || "",
        dueDate: activity?.dueDate
            ? (activity.dueDate.includes('/')
                ? activity.dueDate.split('/').reverse().join('-')
                : activity.dueDate)
            : "",
        description: activity?.description || "",
        });
    }
    }, [open, activity, reset]);

    const onSubmit = async (values: ActivityFormValues) => {
        const payload = {
            titulo: values.title.trim(),
            tipo: values.type,
            curso: values.course.trim(),
            fecha_entrega: values.dueDate,
            descripcion: (values.description ?? "").trim(),
        }

        try {
            let result: any
            if (activity?.id) {
                result = await apiFetch(`/actividades/${activity.id}/`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                })
                toast.success("Actividad actualizada exitosamente.")
            } else {
                result = await apiFetch("/actividades/", {
                    method: "POST",
                    body: JSON.stringify(payload),
                })
                toast.success("Actividad creada exitosamente.")
            }
            onCreated?.(result)
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
                <DialogHeader className="border-b border-border px-1 py-1">
                    <DialogTitle>{activity ? "Editar actividad" : "Nueva actividad"}</DialogTitle>
                    <DialogDescription className="mb-2 text-sm text-muted-foreground">
                        {activity ? "Modifica los detalles de tu actividad." : "A continuación, ingresa los detalles de tu nueva actividad."}
                    </DialogDescription>
                </DialogHeader>

                <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4" >
                    <Label>1. Información general </Label>
                    <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="title">¿Nombre de la actividad? *</Label>
                            <Input id="title" placeholder="Ej: Parcial de Cálculo" {...register("title")} />
                            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="course">¿A qué curso pertenece? *</Label>
                            <Input id="course" placeholder="Ej: Matemáticas II" {...register("course")} />
                            {errors.course && <p className="text-sm text-destructive">{errors.course.message}</p>}
                        </div>
                        
                    </div>

                    <div className="border-b border-border"></div>
                    
                    <Label>2. Evaluación y entrega</Label>
                    <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                        <div className="space-y-1.5">
                            <Label>¿Cómo te van a evaluar? * </Label>
                            <Select
                                defaultValue={activity?.tags?.[0]}
                                onValueChange={(v) => setValue("type", v as ActivityFormValues["type"], { shouldValidate: true })}
                            >
                            <SelectTrigger className="w-full">
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
                            <Label htmlFor="dueDate">¿En que fecha? *</Label>
                            <Input id="dueDate" type="date" min={minDate} {...register("dueDate")} />
                            {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
                        </div>
                    </div>
                    
                    <div className="border-b border-border"></div>
                    
                    <Label>3. Detalles o indicaciones</Label>
                    <div className="space-y-1.5 sm:space-y-0 sm:grid sm:gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="description">¿Quieres agregar algún detalle adicional? </Label>
                            <Input id="description" placeholder="Ej: Temas 1-3, llevar calculadora" {...register("description")} />
                        </div>
                    </div>

                    <DialogFooter className="gap-3 mt-8">
                        {/* <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} className="flex-1" disabled={isSubmitting}>
                            Cancelar
                        </Button> */}
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {activity ? "Guardar Cambios" : "Guardar Actividad"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
