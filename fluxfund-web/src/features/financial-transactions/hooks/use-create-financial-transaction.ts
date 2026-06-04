import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateFinancialTransactionRequest } from "../financial-transaction-types"
import { createFinancialTransaction } from "../financial-transaction-api"
import { invalidateFinancialData } from "./invalidate-financial-data"

export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFinancialTransactionRequest) =>
      createFinancialTransaction(data),

    onSuccess: () => {
      invalidateFinancialData(queryClient)
    },
  })
}