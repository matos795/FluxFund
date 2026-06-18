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
      .optional(),

    documentNumber: z.string().optional(),

    fiscalDocumentPolicy: z
      .enum(["CATEGORY", "REQUIRED", "WAIVED", "MISSING"])
      .default("CATEGORY"),

    fiscalDocumentNote: z
      .string()
      .max(500, "O motivo deve ter no máximo 500 caracteres.")
      .optional()
      .nullable(),
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

    const requiresNote =
      data.type === "EXPENSE" &&
      (
        data.fiscalDocumentPolicy === "WAIVED" ||
        data.fiscalDocumentPolicy === "MISSING"
      )

    if (requiresNote && !data.fiscalDocumentNote?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fiscalDocumentNote"],
        message: "Informe o motivo.",
      })
    }
  })

export type FinancialTransactionFormInput = z.input<
  typeof financialTransactionFormSchema
>

export type FinancialTransactionFormData = z.output<
  typeof financialTransactionFormSchema
>