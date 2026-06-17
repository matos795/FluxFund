import { z } from "zod"

export const createOrganizationUserSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  email: z.string().email("Informe um e-mail válido."),
  temporaryPassword: z
    .string()
    .min(6, "A senha temporária deve ter pelo menos 6 caracteres."),
  role: z.enum(["ADMIN", "FINANCE", "VIEWER"], {
    message: "Selecione o papel do usuário.",
  }),
})

export type CreateOrganizationUserFormInput = z.input<
  typeof createOrganizationUserSchema
>

export type CreateOrganizationUserFormData = z.output<
  typeof createOrganizationUserSchema
>