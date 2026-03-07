import { z } from "zod"

export const ActivitySchema = z.object({
    
    title: z
    .string()
    .nonempty({ message: "Dale un nombre a tu actividad." })
    .min(2, { message: "¡Este nombre es muy corto!" })
    .max(25, { message: "¡Este nombre es muy largo!" }),
    
    type: z
      .enum(["examen", "quiz", "taller", "proyecto", "otro"], { 
            errorMap: () => ({ message: "Selecciona un tipo de evaluación." })
        }),
    
    course: z
    .string()
    .nonempty({ message: "Rellena el nombre del curso." })
        .min(2, { message: "¡Nombre de curso muy corto!" }),
    
    dueDate: z
    .string()
    .min(1, { message: "Ingresa una fecha de entrega." })
    .refine((value) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const selected = new Date(`${value}T00:00:00`)
      return selected >= today 
    }, "¡Esa fecha ya pasó!"),
    
    description: z.string().optional(),
})

export type ActivityFormValues = z.infer<typeof ActivitySchema>
