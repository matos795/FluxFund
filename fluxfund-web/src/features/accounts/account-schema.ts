import { z } from "zod"

export const accountFormSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres."),

  type: z.enum(["BANK", "CASH", "DIGITAL_WALLET", "CREDIT_CARD"], {
    error: "Selecione um tipo de conta.",
  }),

  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  agency: z.string().optional(),
  accountNumber: z.string().optional(),

  initialBalance: z.coerce.number().min(0, "O saldo inicial não pode ser negativo."),

  initialBalanceDate: z.string().min(1, "Informe a data do saldo inicial."),

  active: z.boolean(),
})

export type AccountFormInput = z.input<typeof accountFormSchema>
export type AccountFormData = z.output<typeof accountFormSchema>