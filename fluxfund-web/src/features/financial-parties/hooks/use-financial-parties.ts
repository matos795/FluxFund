import { useQuery } from "@tanstack/react-query"

import { getFinancialParties } from "../financial-party-api"
import type { GetFinancialPartiesParams } from "../financial-party-types"

export function useFinancialParties(
  params: GetFinancialPartiesParams,
) {
  return useQuery({
    queryKey: [
      "financial-parties",
      params,
    ],

    queryFn: () =>
      getFinancialParties(params),
  })
}