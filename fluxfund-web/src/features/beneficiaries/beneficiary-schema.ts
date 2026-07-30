import { z } from "zod"

export const beneficiaryFormSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),

  type: z.enum([
    "DONOR",
    "SUPPORTER",
    "CUSTOMER",
    "SPONSOR",
    "MEMBER",
    "SUPPLIER",
    "SERVICE_PROVIDER",
    "EMPLOYEE",
    "MISSIONARY",
    "PROJECT_RESPONSIBLE",
    "OTHER",
  ], {
    error:
      "Selecione uma classificação.",
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