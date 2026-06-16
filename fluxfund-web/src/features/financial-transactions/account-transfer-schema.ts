import { z } from "zod"

export const accountTransferFormSchema = z
  .object({
    sourceAccountId: z.string().min(1, "Selecione a conta de origem."),
    destinationAccountId: z.string().min(1, "Selecione a conta de destino."),
    transferDate: z.string().min(1, "Informe a data da transferência."),
    amount: z.coerce
      .number()
      .positive("O valor da transferência deve ser maior que zero."),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceAccountId === data.destinationAccountId) {
      ctx.addIssue({
        code: "custom",
        path: ["destinationAccountId"],
        message: "A conta de destino deve ser diferente da origem.",
      })
    }
  })

export type AccountTransferFormInput = z.input<
  typeof accountTransferFormSchema
>

export type AccountTransferFormData = z.output<
  typeof accountTransferFormSchema
>