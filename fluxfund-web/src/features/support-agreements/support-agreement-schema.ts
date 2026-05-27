import { z } from "zod"

export const supportAgreementSchema = z
  .object({
    beneficiaryId: z.string().min(1, "Selecione um favorecido."),
    fundId: z.string().min(1, "Selecione um fundo."),
    amount: z.coerce
      .number()
      .min(0.01, "O valor deve ser maior que zero."),
    startDate: z.string().min(1, "Informe a data inicial."),
    endDate: z.string().optional(),
    description: z.string().max(255).optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true
      return data.endDate >= data.startDate
    },
    {
      message: "A data final não pode ser anterior à data inicial.",
      path: ["endDate"],
    },
  )

export type SupportAgreementFormInput = z.input<typeof supportAgreementSchema>
export type SupportAgreementFormData = z.output<typeof supportAgreementSchema>