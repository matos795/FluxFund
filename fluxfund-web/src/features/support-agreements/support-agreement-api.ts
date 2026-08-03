import {
  httpClient,
} from "@/api/http-client"

import type {
  FinancialCommitment,
} from "@/features/financial-commitments/financial-commitment-types"

import type {
  PageResponse,
} from "@/types/page-response"

import type {
  CreateSupportAgreementRequest,
  CreateSupportAgreementVersionRequest,
  SupportAgreement,
  SupportAgreementStatus,
  UpdateSupportAgreementRequest,
} from "./support-agreement-types"

export type GetSupportAgreementsParams = {
  page?: number
  size?: number

  status?:
  SupportAgreementStatus
}

export type GetSupportAgreementSuggestionsParams = {
  beneficiaryId: string
  referenceDate?: string
}

function toSupportAgreement(
  commitment:
    FinancialCommitment,
): SupportAgreement {
  return {
    id:
      commitment.id,

    organizationId:
      commitment.organizationId,

    beneficiary: {
      id:
        commitment.party.id,

      name:
        commitment.party.name,

      type:
        commitment
          .party
          .classification,
    },

    fund:
      commitment.fund,

    amount:
      commitment.amount,

    startDate:
      commitment.startDate,

    endDate:
      commitment.endDate,

    status:
      commitment.status,

    active:
      commitment.active,

    description:
      commitment.description,

    createdAt:
      commitment.createdAt,

    updatedAt:
      commitment.updatedAt,
  }
}

function buildSupportPayload(
  data:
    | CreateSupportAgreementRequest
    | UpdateSupportAgreementRequest,
) {
  return {
    partyId:
      data.beneficiaryId,

    designatedRecipientId:
      null,

    fundId:
      data.fundId,

    direction:
      "PAYABLE" as const,

    commitmentType:
      "SUPPORT" as const,

    recurrence:
      "MONTHLY" as const,

    amount:
      data.amount,

    dueDay:
      null,

    startDate:
      data.startDate,

    endDate:
      data.endDate ??
      null,

    description:
      data.description ??
      null,
  }
}

export async function getSupportAgreements({
  page = 0,
  size = 10,
  status,
}: GetSupportAgreementsParams) {
  const response =
    await httpClient.get<
      PageResponse<
        FinancialCommitment
      >
    >(
      "/api/v1/financial-commitments",
      {
        params: {
          page,
          size,

          sort:
            "startDate,desc",

          direction:
            "PAYABLE",

          commitmentType:
            "SUPPORT",

          recurrence:
            "MONTHLY",

          status,
        },
      },
    )

  return {
    ...response.data,

    content:
      response.data.content.map(
        toSupportAgreement,
      ),
  }
}

export async function createSupportAgreement(
  data:
    CreateSupportAgreementRequest,
) {
  const response =
    await httpClient.post<
      FinancialCommitment
    >(
      "/api/v1/financial-commitments",
      buildSupportPayload(
        data,
      ),
    )

  return toSupportAgreement(
    response.data,
  )
}

export async function updateSupportAgreement({
  id,
  data,
}: {
  id: string
  data:
  UpdateSupportAgreementRequest
}) {
  const response =
    await httpClient.put<
      FinancialCommitment
    >(
      `/api/v1/financial-commitments/${id}`,
      buildSupportPayload(
        data,
      ),
    )

  return toSupportAgreement(
    response.data,
  )
}

export async function deleteSupportAgreement(
  id: string,
) {
  await httpClient.delete(
    `/api/v1/financial-commitments/${id}`,
  )
}

export async function activateSupportAgreement(
  id: string,
) {
  const response =
    await httpClient.patch<
      FinancialCommitment
    >(
      `/api/v1/financial-commitments/${id}/activate`,
    )

  return toSupportAgreement(
    response.data,
  )
}

export async function getSupportAgreementSuggestions({
  beneficiaryId,
  referenceDate,
}: GetSupportAgreementSuggestionsParams) {
  const response =
    await httpClient.get<
      PageResponse<
        FinancialCommitment
      >
    >(
      "/api/v1/financial-commitments",
      {
        params: {
          page:
            0,

          size:
            100,

          direction:
            "PAYABLE",

          commitmentType:
            "SUPPORT",

          recurrence:
            "MONTHLY",

          status:
            "ACTIVE",

          partyId:
            beneficiaryId,

          referenceDate:
            referenceDate ||
            undefined,
        },
      },
    )

  return response.data.content
    .sort(
      (
        first,
        second,
      ) =>
        first.fund.name
          .localeCompare(
            second.fund.name,
            "pt-BR",
          ),
    )
    .map(
      toSupportAgreement,
    )
}

export async function createSupportAgreementVersion({
  id,
  data,
}: {
  id: string

  data:
  CreateSupportAgreementVersionRequest
}) {
  const response =
    await httpClient.post<
      FinancialCommitment
    >(
      `/api/v1/financial-commitments/${id}/versions`,
      data,
    )

  return toSupportAgreement(
    response.data,
  )
}