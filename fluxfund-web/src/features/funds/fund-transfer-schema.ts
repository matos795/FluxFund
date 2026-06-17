import { z } from "zod"

export const fundTransferFormSchema = z
  .object({
    sourceFundId: z.string().min(1, "Selecione o fundo de origem."),
    destinationFundId: z.string().min(1, "Selecione o fundo de destino."),
    transferDate: z.string().min(1, "Informe a data da transferência."),
    amount: z.coerce
      .number()
      .positive("O valor deve ser maior que zero."),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceFundId === data.destinationFundId) {
      ctx.addIssue({
        code: "custom",
        path: ["destinationFundId"],
        message: "O fundo de destino deve ser diferente da origem.",
      })
    }
  })

export type FundTransferFormInput = z.input<typeof fundTransferFormSchema>
export type FundTransferFormData = z.output<typeof fundTransferFormSchema>