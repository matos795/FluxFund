import { z } from "zod"

import { platformOrganizationOnboardingStatuses } from "./platform-organization-onboarding-types"

const manualPreparationFields = [
  "contractSigned",
  "categoriesReviewed",
  "documentationRulesReviewed",
  "initialImportValidated",
  "testReportValidated",
  "usersTrained",
  "initialBackupConfirmed",
] as const

export const platformOrganizationOnboardingSchema = z
  .object({
    status: z.enum(
      platformOrganizationOnboardingStatuses,
    ),

    planName: z
      .string()
      .max(
        100,
        "O nome do plano deve ter no máximo 100 caracteres.",
      ),

    monthlyFee: z
      .number()
      .min(
        0,
        "A mensalidade não pode ser negativa.",
      )
      .optional(),

    setupFee: z
      .number()
      .min(
        0,
        "A taxa de implantação não pode ser negativa.",
      )
      .optional(),

    contractStartDate: z.string(),

    billingDueDay: z
      .number()
      .int(
        "O dia de vencimento deve ser inteiro.",
      )
      .min(
        1,
        "O dia deve estar entre 1 e 28.",
      )
      .max(
        28,
        "O dia deve estar entre 1 e 28.",
      )
      .optional(),

    contractSigned: z.boolean(),
    categoriesReviewed: z.boolean(),
    documentationRulesReviewed:
      z.boolean(),
    initialImportValidated: z.boolean(),
    testReportValidated: z.boolean(),
    usersTrained: z.boolean(),
    initialBackupConfirmed: z.boolean(),
    goLiveApproved: z.boolean(),

    internalNotes: z
      .string()
      .max(
        5000,
        "As observações devem ter no máximo 5000 caracteres.",
      ),
  })
  .superRefine(
    (
      data,
      context,
    ) => {
      const preparingForLaunch =
        data.status ===
          "READY_FOR_LAUNCH" ||
        data.status === "LIVE"

      if (!preparingForLaunch) {
        return
      }

      if (!data.planName.trim()) {
        context.addIssue({
          code: "custom",
          path: ["planName"],
          message:
            "Informe o plano antes do lançamento.",
        })
      }

      if (data.monthlyFee === undefined) {
        context.addIssue({
          code: "custom",
          path: ["monthlyFee"],
          message:
            "Informe a mensalidade antes do lançamento.",
        })
      }

      if (!data.contractStartDate) {
        context.addIssue({
          code: "custom",
          path: [
            "contractStartDate",
          ],
          message:
            "Informe a data inicial do contrato.",
        })
      }

      if (
        data.billingDueDay ===
        undefined
      ) {
        context.addIssue({
          code: "custom",
          path: ["billingDueDay"],
          message:
            "Informe o dia de vencimento.",
        })
      }

      manualPreparationFields.forEach(
        (field) => {
          if (!data[field]) {
            context.addIssue({
              code: "custom",
              path: [field],
              message:
                "Este item precisa ser concluído antes do lançamento.",
            })
          }
        },
      )

      if (
        data.status === "LIVE" &&
        !data.goLiveApproved
      ) {
        context.addIssue({
          code: "custom",
          path: ["goLiveApproved"],
          message:
            "A entrada em produção precisa ser aprovada.",
        })
      }
    },
  )

export type PlatformOrganizationOnboardingFormInput =
  z.input<
    typeof platformOrganizationOnboardingSchema
  >

export type PlatformOrganizationOnboardingFormData =
  z.output<
    typeof platformOrganizationOnboardingSchema
  >