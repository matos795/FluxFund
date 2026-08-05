import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  updateFinancialCommitment,
} from "../financial-commitment-api"

import {
  invalidateFinancialCommitments,
} from "./invalidate-financial-commitments"

export function useUpdateFinancialCommitment() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn:
      updateFinancialCommitment,

    onSuccess: () =>
      invalidateFinancialCommitments(
        queryClient,
      ),
  })
}