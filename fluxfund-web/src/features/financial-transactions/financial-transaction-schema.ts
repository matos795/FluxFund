import { z } from "zod"

export const financialTransactionFormSchema = z
  .object({
    accountId: z.string().min(1, "Selecione uma conta."),

    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"], {
      error: "Selecione o tipo da transação.",
    }),

    categoryId: z.string().optional(),

    dueDate: z.string().optional(),
    settlementDate: z.string().optional(),

    expectedAmount: z.coerce
      .number()
      .positive("O valor previsto deve ser maior que zero."),

    settledAmount: z.coerce.number().optional(),

    description: z
      .string()
      .min(3, "A descrição deve ter pelo menos 3 caracteres."),

    documentNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasSettlementDate = Boolean(data.settlementDate)
    const hasSettledAmount =
      data.settledAmount !== undefined &&
      data.settledAmount !== null &&
      data.settledAmount > 0

    if (hasSettlementDate && !hasSettledAmount) {
      ctx.addIssue({
        code: "custom",
        path: ["settledAmount"],
        message: "Informe o valor baixado quando houver data de baixa.",
      })
    }

    if (hasSettledAmount && !hasSettlementDate) {
      ctx.addIssue({
        code: "custom",
        path: ["settlementDate"],
        message: "Informe a data de baixa quando houver valor baixado.",
      })
    }

    if (data.type !== "TRANSFER" && !data.categoryId) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Selecione uma categoria.",
      })
    }
  })

export type FinancialTransactionFormInput = z.input<
  typeof financialTransactionFormSchema
>

export type FinancialTransactionFormData = z.output<
  typeof financialTransactionFormSchema
>