import { z } from "zod"

export const createOrganizationUserInvitationSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(2, "Informe o nome.")
      .max(150, "O nome deve possuir até 150 caracteres."),

    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail.")
      .email("Informe um e-mail válido.")
      .max(255, "O e-mail deve possuir até 255 caracteres."),

    role: z.enum([
      "ADMIN",
      "FINANCE",
      "VIEWER",
    ]),
  })

export type CreateOrganizationUserInvitationFormData =
  z.infer<
    typeof createOrganizationUserInvitationSchema
  >