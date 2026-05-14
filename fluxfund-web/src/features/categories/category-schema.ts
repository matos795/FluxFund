import { z } from "zod"

export const categoryFormSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    type: z.enum(["INCOME", "EXPENSE"], {
        error: "Selecione um tipo de categoria.",
    }),
    parentId: z.string().optional().nullable(),
})

export type CategoryFormInput = z.input<typeof categoryFormSchema>
export type CategoryFormData = z.output<typeof categoryFormSchema>