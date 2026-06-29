import { z } from "zod"

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

const optionalText = (maxLength: number, fieldName: string) =>
  z
    .string()
    .trim()
    .max(
      maxLength,
      `${fieldName} deve ter no máximo ${maxLength} caracteres.`,
    )

const optionalEmail = z
  .string()
  .trim()
  .max(255, "E-mail deve ter no máximo 255 caracteres.")
  .refine(
    (value) =>
      value === "" ||
      z.string().email().safeParse(value).success,
    "Informe um e-mail válido.",
  )

const optionalCnpj = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" || onlyDigits(value).length === 14,
    "Informe um CNPJ com 14 dígitos.",
  )

const optionalZipCode = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" || onlyDigits(value).length === 8,
    "Informe um CEP com 8 dígitos.",
  )

const optionalState = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^[a-zA-Z]{2}$/.test(value),
    "Informe a sigla do estado com duas letras.",
  )
  .transform((value) => value.toUpperCase())

export const updateOrganizationProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(255, "O nome deve ter no máximo 255 caracteres."),

  legalName: optionalText(255, "Razão social"),
  cnpj: optionalCnpj,

  contactEmail: optionalEmail,
  contactPhone: optionalText(30, "Telefone"),

  addressLine: optionalText(255, "Logradouro"),
  addressNumber: optionalText(30, "Número"),
  addressComplement: optionalText(120, "Complemento"),
  neighborhood: optionalText(120, "Bairro"),
  city: optionalText(120, "Cidade"),
  state: optionalState,
  zipCode: optionalZipCode,

  reviewerName: optionalText(120, "Nome do conferente"),
  reviewerTitle: optionalText(120, "Cargo do conferente"),
  approverName: optionalText(120, "Nome do aprovador"),
  approverTitle: optionalText(120, "Cargo do aprovador"),
})

export type UpdateOrganizationProfileFormInput = z.input<
  typeof updateOrganizationProfileSchema
>

export type UpdateOrganizationProfileFormData = z.output<
  typeof updateOrganizationProfileSchema
>