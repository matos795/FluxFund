import {
  httpClient,
} from "@/api/http-client"

import type {
  PageResponse,
} from "@/types/page-response"

import type {
  CreateFinancialCommitmentRequest,
  FinancialCommitment,
  GetFinancialCommitmentsParams,
  UpdateFinancialCommitmentRequest,
} from "./financial-commitment-types"

export async function getFinancialCommitments({
  page = 0,
  size = 10,
  sort = "startDate,desc",
  search,
  direction,
  commitmentType,
  recurrence,
  status,
  partyId,
  designatedRecipientId,
  fundId,
}: GetFinancialCommitmentsParams = {}) {
  const response =
    await httpClient.get<
      PageResponse<FinancialCommitment>
    >(
      "/api/v1/financial-commitments",
      {
        params: {
          page,
          size,
          sort,

          search:
            search?.trim() ||
            undefined,

          direction,
          commitmentType,
          recurrence,
          status,

          partyId:
            partyId || undefined,

          designatedRecipientId:
            designatedRecipientId ||
            undefined,

          fundId:
            fundId || undefined,
        },
      },
    )

  return response.data
}

export async function createFinancialCommitment(
  data:
    CreateFinancialCommitmentRequest,
) {
  const response =
    await httpClient.post<
      FinancialCommitment
    >(
      "/api/v1/financial-commitments",
      data,
    )

  return response.data
}

export async function updateFinancialCommitment({
  id,
  data,
}: {
  id: string

  data:
    UpdateFinancialCommitmentRequest
}) {
  const response =
    await httpClient.put<
      FinancialCommitment
    >(
      `/api/v1/financial-commitments/${id}`,
      data,
    )

  return response.data
}

export async function deactivateFinancialCommitment(
  id: string,
) {
  await httpClient.delete(
    `/api/v1/financial-commitments/${id}`,
  )
}

export async function activateFinancialCommitment(
  id: string,
) {
  const response =
    await httpClient.patch<
      FinancialCommitment
    >(
      `/api/v1/financial-commitments/${id}/activate`,
    )

  return response.data
}