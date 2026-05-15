import { z } from "zod"

export const fundFormSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),

  description: z
    .string()
    .max(1000, "A descrição deve ter no máximo 1000 caracteres.")
    .optional(),

  initialBalance: z.coerce
    .number({
      message: "Informe o saldo inicial.",
    }),

  initialBalanceDate: z.string().optional(),
})

export type FundFormInput = z.input<typeof fundFormSchema>
export type FundFormData = z.output<typeof fundFormSchema>