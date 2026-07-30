import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"

import type {
  FinancialParty,
  GetFinancialPartiesParams,
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
    >("/api/v1/financial-parties", {
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
    })

  return response.data
}