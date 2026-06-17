import { z } from "zod"

export const updateOrganizationProfileSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(255, "O nome deve ter no máximo 255 caracteres."),
})

export type UpdateOrganizationProfileFormInput = z.input<
  typeof updateOrganizationProfileSchema
>

export type UpdateOrganizationProfileFormData = z.output<
  typeof updateOrganizationProfileSchema
>
