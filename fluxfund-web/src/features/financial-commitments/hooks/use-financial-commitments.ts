import {
  useQuery,
} from "@tanstack/react-query"

import {
  getFinancialCommitments,
} from "../financial-commitment-api"

import type {
  GetFinancialCommitmentsParams,
} from "../financial-commitment-types"

export function useFinancialCommitments(
  params:
    GetFinancialCommitmentsParams,
) {
  return useQuery({
    queryKey: [
      "financial-commitments",
      params,
    ],

    queryFn: () =>
      getFinancialCommitments(
        params,
      ),
  })
}