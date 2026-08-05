import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"

import type {
  CreateFinancialPartyRequest,
  FinancialParty,
  FinancialPartyOption,
  FinancialPartyOverview,
  FinancialPartyRole,
  GetFinancialPartiesParams,
  UpdateFinancialPartyRequest,
} from "./financial-party-types"

export async function getFinancialParties({
  page = 0,
  size = 10,
  search,
  partyType,
  classification,
  role,
  active = true,
}: GetFinancialPartiesParams = {}) {
  const response =
    await httpClient.get<
      PageResponse<FinancialParty>
    >(
      "/api/v1/financial-parties",
      {
        params: {
          page,
          size,

          search:
            search && search.trim()
              ? search.trim()
              : undefined,

          partyType,
          classification,
          role,
          active,
        },
      },
    )

  return response.data
}

export async function createFinancialParty(
  data: CreateFinancialPartyRequest,
) {
  const response =
    await httpClient.post<
      FinancialParty
    >(
      "/api/v1/financial-parties",
      data,
    )

  return response.data
}

export async function updateFinancialParty(
  data: UpdateFinancialPartyRequest,
) {
  const {
    id,
    ...body
  } = data

  const response =
    await httpClient.put<
      FinancialParty
    >(
      `/api/v1/financial-parties/${id}`,
      body,
    )

  return response.data
}

export async function deactivateFinancialParty(
  id: string,
) {
  await httpClient.delete(
    `/api/v1/financial-parties/${id}`,
  )
}

export async function activateFinancialParty(
  id: string,
) {
  const response =
    await httpClient.post<
      FinancialParty
    >(
      `/api/v1/financial-parties/${id}/activate`,
    )

  return response.data
}

export async function getFinancialPartyOptions(
  role?: FinancialPartyRole,
) {
  const response =
    await httpClient.get<
      FinancialPartyOption[]
    >(
      "/api/v1/financial-parties/options",
      {
        params: {
          role,
        },
      },
    )

  return response.data
}

export async function getFinancialPartyOverview(
  partyId:
    string,
) {
  const response =
    await httpClient.get<
      FinancialPartyOverview
    >(
      `/api/v1/financial-parties/${partyId}/overview`,
    )

  return response.data
}