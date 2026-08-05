import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  deactivateFinancialCommitment,
} from "../financial-commitment-api"

import {
  invalidateFinancialCommitments,
} from "./invalidate-financial-commitments"

export function useDeactivateFinancialCommitment() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn:
      deactivateFinancialCommitment,

    onSuccess: () =>
      invalidateFinancialCommitments(
        queryClient,
      ),
  })
}