import {
  useQuery,
} from "@tanstack/react-query"

import {
  getFinancialPartyOptions,
} from "../financial-party-api"

import type {
  FinancialPartyRole,
} from "../financial-party-types"

export function useFinancialPartyOptions(
  role?: FinancialPartyRole,
) {
  return useQuery({
    queryKey: [
      "financial-party-options",
      role ?? "ALL",
    ],

    queryFn: () =>
      getFinancialPartyOptions(
        role,
      ),
  })
}