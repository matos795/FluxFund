import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createFinancialCommitment,
} from "../financial-commitment-api"

import {
  invalidateFinancialCommitments,
} from "./invalidate-financial-commitments"

export function useCreateFinancialCommitment() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn:
      createFinancialCommitment,

    onSuccess: () =>
      invalidateFinancialCommitments(
        queryClient,
      ),
  })
}