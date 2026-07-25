import { z } from "zod"

export const createPlatformOrganizationSchema =
  z.object({
    organizationName: z
      .string()
      .trim()
      .min(
        1,
        "Informe o nome da organização.",
      )
      .max(
        150,
        "O nome deve possuir até 150 caracteres.",
      ),

    ownerName: z
      .string()
      .trim()
      .min(
        1,
        "Informe o nome do responsável.",
      )
      .max(
        150,
        "O nome deve possuir até 150 caracteres.",
      ),

    ownerEmail: z
      .string()
      .trim()
      .min(
        1,
        "Informe o e-mail do responsável.",
      )
      .email(
        "Informe um e-mail válido.",
      )
      .max(
        255,
        "O e-mail deve possuir até 255 caracteres.",
      ),
  })

export type CreatePlatformOrganizationFormInput =
  z.input<
    typeof createPlatformOrganizationSchema
  >

export type CreatePlatformOrganizationFormData =
  z.output<
    typeof createPlatformOrganizationSchema
  >