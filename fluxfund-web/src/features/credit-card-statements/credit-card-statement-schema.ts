import { z } from "zod"

export const creditCardStatementFormSchema = z.object({
  creditCardAccountId: z.string().min(1, "Selecione o cartão."),
  name: z.string().min(1, "Informe o nome da fatura."),
  closingDate: z.string().optional(),
  dueDate: z.string().min(1, "Informe o vencimento da fatura."),
})

export const creditCardStatementItemFormSchema = z
  .object({
    purchaseDate: z.string().min(1, "Informe a data da compra."),
    description: z.string().min(1, "Informe a descrição do item."),
    amount: z.coerce.number().positive("Informe um valor maior que zero."),
    categoryId: z.string().uuid("Selecione uma categoria."),
    documentNumber: z.string().optional(),
    installmentNumber: z.coerce.number().optional(),
    installmentCount: z.coerce.number().optional(),
    fundId: z.string().optional(),
    beneficiaryId: z.string().optional(),
    referenceMonth: z.string().optional(),
    allocationAmount: z.coerce.number().optional(),
  })
  .superRefine((data, ctx) => {
    const hasFund = Boolean(data.fundId)
    const hasAllocationAmount = data.allocationAmount !== undefined && data.allocationAmount > 0

    const hasAnyAllocationField = hasFund || hasAllocationAmount

    if (!hasAnyAllocationField) {
      return
    }

    if (!data.fundId) {
      ctx.addIssue({
        code: "custom",
        path: ["fundId"],
        message: "Selecione o fundo da alocação.",
      })
    }

    if (!hasAllocationAmount) {
      ctx.addIssue({
        code: "custom",
        path: ["allocationAmount"],
        message: "Informe um valor de alocação maior que zero.",
      })
    }

    if (hasAllocationAmount && data.allocationAmount !== undefined && data.allocationAmount > data.amount) {
      ctx.addIssue({
        code: "custom",
        path: ["allocationAmount"],
        message: "A alocação não pode ser maior que o item.",
      })
    }
  })

export const payCreditCardStatementFormSchema = z.object({
  paymentAccountId: z.string().min(1, "Selecione a conta de pagamento."),
  paymentDate: z.string().min(1, "Informe a data de pagamento."),
  paymentTransactionId: z.string().optional(),
})

export type CreditCardStatementFormInput = z.input<
  typeof creditCardStatementFormSchema
>

export type CreditCardStatementFormData = z.output<
  typeof creditCardStatementFormSchema
>

export type CreditCardStatementItemFormInput = z.input<
  typeof creditCardStatementItemFormSchema
>

export type CreditCardStatementItemFormData = z.output<
  typeof creditCardStatementItemFormSchema
>

export type PayCreditCardStatementFormInput = z.input<
  typeof payCreditCardStatementFormSchema
>

export type PayCreditCardStatementFormData = z.output<
  typeof payCreditCardStatementFormSchema
>
