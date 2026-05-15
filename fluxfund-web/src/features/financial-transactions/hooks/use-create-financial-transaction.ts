import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateFinancialTransactionRequest } from "../financial-transaction-types"
import { createFinancialTransaction } from "../financial-transaction-api"

export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFinancialTransactionRequest) =>
      createFinancialTransaction(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financial-transactions"],
      })
    },
  })
}