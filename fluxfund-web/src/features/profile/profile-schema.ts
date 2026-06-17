import { z } from "zod"

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(255, "O nome deve ter no máximo 255 caracteres."),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z
      .string()
      .min(6, "A nova senha deve ter pelo menos 6 caracteres.")
      .max(100, "A nova senha deve ter no máximo 100 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "A confirmação deve ser igual à nova senha.",
      })
    }
  })

export type UpdateProfileFormInput = z.input<typeof updateProfileSchema>
export type UpdateProfileFormData = z.output<typeof updateProfileSchema>

export type ChangePasswordFormInput = z.input<typeof changePasswordSchema>
export type ChangePasswordFormData = z.output<typeof changePasswordSchema>
