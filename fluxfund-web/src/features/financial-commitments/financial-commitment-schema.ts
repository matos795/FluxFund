import { z } from "zod"

import {
  payableCommitmentTypes,
  receivableCommitmentTypes,
} from "./financial-commitment-labels"

const financialCommitmentBaseSchema =
  z.object({
    partyId: z
      .string()
      .min(
        1,
        "Selecione o contato principal.",
      ),

    designatedRecipientId:
      z.string().optional(),

    fundId: z
      .string()
      .min(
        1,
        "Selecione o fundo.",
      ),

    direction: z.enum([
      "RECEIVABLE",
      "PAYABLE",
    ]),

    commitmentType: z.enum([
      "SUPPORT",
      "DONATION",
      "CUSTOMER_PAYMENT",
      "SPONSORSHIP",
      "MEMBER_CONTRIBUTION",
      "SUPPLIER_PAYMENT",
      "SALARY",
      "SERVICE_PAYMENT",
      "REIMBURSEMENT",
      "OTHER",
    ]),

    recurrence: z.enum([
      "ONE_TIME",
      "MONTHLY",
    ]),

    amount: z.coerce
      .number()
      .positive(
        "O valor deve ser maior que zero.",
      ),

    /*
     * Mantemos como string no formulário
     * porque um input vazio envia "".
     */
    dueDay: z
      .string()
      .trim()
      .refine(
        (value) => {
          if (value === "") {
            return true
          }

          const number =
            Number(value)

          return (
            Number.isInteger(number) &&
            number >= 1 &&
            number <= 31
          )
        },
        {
          message:
            "O dia previsto deve estar entre 1 e 31.",
        },
      ),

    startDate: z
      .string()
      .min(
        1,
        "Informe a data inicial.",
      ),

    endDate:
      z.string().optional(),

    description: z
      .string()
      .max(
        255,
        "A descrição deve ter no máximo 255 caracteres.",
      ),
  })

export const financialCommitmentFormSchema =
  financialCommitmentBaseSchema
    .superRefine(
      (data, context) => {
        const allowedTypes =
          data.direction ===
          "RECEIVABLE"
            ? receivableCommitmentTypes
            : payableCommitmentTypes

        if (
          !allowedTypes.includes(
            data.commitmentType,
          )
        ) {
          context.addIssue({
            code:
              "custom",
            path: [
              "commitmentType",
            ],
            message:
              "O tipo não é compatível com a direção do compromisso.",
          })
        }

        if (
          data.direction ===
            "PAYABLE" &&
          data.designatedRecipientId
        ) {
          context.addIssue({
            code:
              "custom",
            path: [
              "designatedRecipientId",
            ],
            message:
              "Compromissos a pagar não possuem destinatário adicional.",
          })
        }

        if (
          data.partyId &&
          data.designatedRecipientId &&
          data.partyId ===
            data.designatedRecipientId
        ) {
          context.addIssue({
            code:
              "custom",
            path: [
              "designatedRecipientId",
            ],
            message:
              "O doador e o destinatário devem ser contatos diferentes.",
          })
        }

        if (
          data.endDate &&
          data.startDate &&
          data.endDate <
            data.startDate
        ) {
          context.addIssue({
            code:
              "custom",
            path: [
              "endDate",
            ],
            message:
              "A data final não pode ser anterior à inicial.",
          })
        }

        if (
          data.recurrence ===
            "ONE_TIME" &&
          data.dueDay !== ""
        ) {
          context.addIssue({
            code:
              "custom",
            path: [
              "dueDay",
            ],
            message:
              "Compromissos pontuais não utilizam dia mensal.",
          })
        }
      },
    )
    .transform(
      (data) => ({
        partyId:
          data.partyId,

        designatedRecipientId:
          data.direction ===
            "RECEIVABLE" &&
          data.designatedRecipientId

            ? data
                .designatedRecipientId
            : null,

        fundId:
          data.fundId,

        direction:
          data.direction,

        commitmentType:
          data.commitmentType,

        recurrence:
          data.recurrence,

        amount:
          data.amount,

        dueDay:
          data.recurrence ===
            "MONTHLY" &&
          data.dueDay

            ? Number(
                data.dueDay,
              )
            : null,

        startDate:
          data.startDate,

        endDate:
          data.recurrence ===
            "MONTHLY" &&
          data.endDate

            ? data.endDate
            : null,

        description:
          data.description
            .trim() || null,
      }),
    )

export type FinancialCommitmentFormInput =
  z.input<
    typeof financialCommitmentFormSchema
  >

export type FinancialCommitmentFormData =
  z.output<
    typeof financialCommitmentFormSchema
  >