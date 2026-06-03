import { z } from "zod"

export const transactionAllocationFormSchema = z.object({
  fundId: z.string().min(1, "Selecione um fundo."),

  beneficiaryId: z.string().optional(),

  referenceMonth: z.string().optional(),

  amount: z.coerce
    .number()
    .positive("O valor da alocação deve ser maior que zero."),
})

export type TransactionAllocationFormInput = z.input<
  typeof transactionAllocationFormSchema
>

export type TransactionAllocationFormData = z.output<
  typeof transactionAllocationFormSchema
>