import {
    httpClient,
} from "@/api/http-client"

import type {
    PageResponse,
} from "@/types/page-response"

import type {
    CreateFinancialCommitmentRequest,
    CreateFinancialCommitmentVersionRequest,
    FinancialCommitment,
    FinancialCommitmentAllocationSuggestion,
    FinancialCommitmentReconciliationItem,
    GetFinancialCommitmentReconciliationParams,
    GetFinancialCommitmentsParams,
    LinkFinancialCommitmentReconciliationRequest,
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
    referenceDate,
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

                    search: search?.trim() || undefined,

                    direction,
                    commitmentType,
                    recurrence,
                    status,

                    partyId: partyId || undefined,

                    designatedRecipientId: designatedRecipientId || undefined,

                    fundId: fundId || undefined,

                    referenceDate: referenceDate || undefined,
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

export async function createFinancialCommitmentVersion({
    id,
    data,
}: {
    id: string

    data:
    CreateFinancialCommitmentVersionRequest
}) {
    const response =
        await httpClient.post<
            FinancialCommitment
        >(
            `/api/v1/financial-commitments/${id}/versions`,
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

export async function getFinancialCommitmentAllocationSuggestions({
    transactionType,
    sourcePartyId,
    recipientPartyId,
    fundId,
    referenceMonth,
    availableAmount,
    excludedAllocationId,
}: {
    transactionType:
    "INCOME" | "EXPENSE"

    sourcePartyId?:
    string | null

    recipientPartyId?:
    string | null

    fundId: string
    referenceMonth: string
    availableAmount: number

    excludedAllocationId?:
    string | null
}) {
    const response =
        await httpClient.get<FinancialCommitmentAllocationSuggestion[]
        >(
            "/api/v1/financial-commitments/allocation-suggestions",
            {
                params: {
                    transactionType,
                    sourcePartyId: sourcePartyId || undefined,
                    recipientPartyId: recipientPartyId || undefined,
                    fundId,
                    referenceMonth:
                        `${referenceMonth}-01`,

                    availableAmount,

                    excludedAllocationId:
                        excludedAllocationId ||
                        undefined,
                },
            },
        )

    return response.data
}

export async function getFinancialCommitmentReconciliation({
  startMonth,
  endMonth,
  transactionType,
  page = 0,
  size = 8,
}: GetFinancialCommitmentReconciliationParams) {
  const response =
    await httpClient.get<
      PageResponse<
        FinancialCommitmentReconciliationItem
      >
    >(
      "/api/v1/financial-commitments/reconciliation",
      {
        params: {
          startMonth:
            `${startMonth}-01`,

          endMonth:
            `${endMonth}-01`,

          transactionType:
            transactionType ||
            undefined,

          page,
          size,

          sort:
            "referenceMonth,desc",
        },
      },
    )

  return response.data
}

export async function linkFinancialCommitmentReconciliation({
  transactionId,
  allocationId,
  financialCommitmentId,
}: LinkFinancialCommitmentReconciliationRequest) {
  const response =
    await httpClient.patch(
      `/api/v1/financial-commitments/reconciliation/${transactionId}/allocations/${allocationId}`,

      {
        financialCommitmentId,
      },
    )

  return response.data
}