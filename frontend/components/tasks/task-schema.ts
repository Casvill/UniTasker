import { z } from "zod"

export const ActivitySchema = z.object({
    title: z.string().min(2, "El título es obligatorio (mínimo 2 caracteres)."),
    type: z.enum(["examen", "quiz", "taller", "proyecto", "otro"]).default("otro"),
    course: z.string().min(2, "El curso es obligatorio (mínimo 2 caracteres)."),
    dueDate: z
    .string()
    .min(1, "La fecha de entrega es obligatoria.")
    .refine((value) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const selected = new Date(`${value}T00:00:00`)
      return selected >= today 
    }, "Esa fecha ya pasó."),
    description: z.string().optional(),
})

export type ActivityFormValues = z.infer<typeof ActivitySchema>
