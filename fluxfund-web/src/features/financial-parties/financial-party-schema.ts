import { z } from "zod"

export const financialPartyFormSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        3,
        "O nome deve ter pelo menos 3 caracteres.",
      )
      .max(
        100,
        "O nome deve ter no máximo 100 caracteres.",
      ),

    partyType: z.enum(
      [
        "INDIVIDUAL",
        "LEGAL_ENTITY",
      ],
      {
        error:
          "Selecione a natureza do contato.",
      },
    ),

    type: z.enum(
      [
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
      ],
      {
        error:
          "Selecione uma classificação.",
      },
    ),

    roles: z
      .array(
        z.enum([
          "INCOME_SOURCE",
          "PAYMENT_RECIPIENT",
        ]),
      )
      .min(
        1,
        "Selecione pelo menos um papel financeiro.",
      ),

    document: z
      .string()
      .max(
        30,
        "O documento deve ter no máximo 30 caracteres.",
      ),

    email: z
      .string()
      .email(
        "Informe um e-mail válido.",
      )
      .or(z.literal("")),

    phone: z
      .string()
      .max(
        30,
        "O telefone deve ter no máximo 30 caracteres.",
      ),

    legalName: z
      .string()
      .max(
        255,
        "A razão social deve ter no máximo 255 caracteres.",
      ),

    contactPerson: z
      .string()
      .max(
        255,
        "O responsável deve ter no máximo 255 caracteres.",
      ),

    addressLine: z
      .string()
      .max(
        255,
        "O logradouro deve ter no máximo 255 caracteres.",
      ),

    addressNumber: z
      .string()
      .max(
        50,
        "O número deve ter no máximo 50 caracteres.",
      ),

    addressComplement: z
      .string()
      .max(
        255,
        "O complemento deve ter no máximo 255 caracteres.",
      ),

    neighborhood: z
      .string()
      .max(
        255,
        "O bairro deve ter no máximo 255 caracteres.",
      ),

    city: z
      .string()
      .max(
        255,
        "A cidade deve ter no máximo 255 caracteres.",
      ),

    state: z
      .string()
      .max(
        2,
        "Use a sigla do estado com dois caracteres.",
      )
      .refine(
        (value) =>
          value.trim() === "" ||
          value.trim().length === 2,
        {
          message:
            "Use a sigla do estado com dois caracteres.",
        },
      ),

    zipCode: z
      .string()
      .max(
        9,
        "Informe um CEP válido.",
      )
      .refine(
        (value) => {
          if (value.trim() === "") {
            return true
          }

          return (
            value.replace(/\D/g, "")
              .length === 8
          )
        },
        {
          message:
            "O CEP deve possuir oito dígitos.",
        },
      ),

    notes: z
      .string()
      .max(
        2000,
        "As observações devem ter no máximo 2.000 caracteres.",
      ),
  })

export type FinancialPartyFormInput =
  z.input<
    typeof financialPartyFormSchema
  >

export type FinancialPartyFormData =
  z.output<
    typeof financialPartyFormSchema
  >