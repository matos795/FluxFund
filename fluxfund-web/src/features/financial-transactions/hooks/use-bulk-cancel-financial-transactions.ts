import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  bulkCancelFinancialTransactions,
} from "../financial-transaction-api"

import {
  invalidateFinancialData,
} from "./invalidate-financial-data"

export function useBulkCancelFinancialTransactions() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn:
      (
        transactionIds:
          string[],
      ) =>
        bulkCancelFinancialTransactions(
          transactionIds,
        ),

    onSuccess: () => {
      invalidateFinancialData(
        queryClient,
      )
    },
  })
}