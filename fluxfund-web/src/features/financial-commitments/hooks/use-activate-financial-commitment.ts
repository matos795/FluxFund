import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  activateFinancialCommitment,
} from "../financial-commitment-api"

import {
  invalidateFinancialCommitments,
} from "./invalidate-financial-commitments"

export function useActivateFinancialCommitment() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn:
      activateFinancialCommitment,

    onSuccess: () =>
      invalidateFinancialCommitments(
        queryClient,
      ),
  })
}