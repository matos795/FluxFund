import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateFinancialTransaction } from "@/features/financial-transactions/financial-transaction-api"
import type { UpdateFinancialTransactionRequest } from "@/features/financial-transactions/financial-transaction-types"

type UpdateFinancialTransactionMutationData = {
  id: string
  data: UpdateFinancialTransactionRequest
}

export function useUpdateFinancialTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: UpdateFinancialTransactionMutationData) =>
      updateFinancialTransaction(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financial-transactions"],
      })
    },
  })
}