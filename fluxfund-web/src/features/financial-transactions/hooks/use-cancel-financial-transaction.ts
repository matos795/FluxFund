import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cancelFinancialTransaction } from "../financial-transaction-api"
import { invalidateFinancialData } from "./invalidate-financial-data"

export function useCancelFinancialTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cancelFinancialTransaction(id),

    onSuccess: () => {
      invalidateFinancialData(queryClient)
    },
  })
}