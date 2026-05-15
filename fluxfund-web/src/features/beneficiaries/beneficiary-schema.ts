import { z } from "zod"

export const beneficiaryFormSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),

  type: z.enum(["MISSIONARY", "SUPPLIER", "EMPLOYEE", "PROJECT_RESPONSIBLE", "OTHER"], {
    error: "Selecione um tipo de favorecido.",
  }),
  document: z.string().optional(),
  email: z
  .string()
  .email("Informe um email válido.")
  .optional()
  .or(z.literal("")),
  phone: z.string().optional()
  })

export type BeneficiaryFormInput = z.input<typeof beneficiaryFormSchema>
export type BeneficiaryFormData = z.output<typeof beneficiaryFormSchema>