import { z } from "zod"

export const SubtaskSchema = z.object({
  nombre: z
    .string()
    .nonempty({ message: "Escribe un nombre para la tarea." })
    .min(2, { message: "El nombre es muy corto." })
    .max(80, { message: "El nombre es muy largo." }),

  fecha: z
    .string()
    .min(1, { message: "Selecciona una fecha objetivo." })
    .refine((value) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const selected = new Date(`${value}T00:00:00`)
      return selected >= today 
    }, "¡Esa fecha ya pasó!"),

  horas: z
    .string()
    .min(1, { message: "Ingresa horas estimadas." })
    .refine((v) => !Number.isNaN(Number(v)), { message: "Debe ser un número válido." })
    .refine((v) => Number(v) > 0, { message: "Las horas deben ser mayores a 0." }),
})

export type SubtaskFormValues = z.infer<typeof SubtaskSchema>