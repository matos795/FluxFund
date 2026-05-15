import { useMutation, useQueryClient } from "@tanstack/react-query"

import { addTransactionAllocation } from "@/features/financial-transactions/financial-transaction-api"
import type { CreateTransactionAllocationRequest } from "@/features/financial-transactions/financial-transaction-types"

type AddTransactionAllocationMutationData = {
  transactionId: string
  data: CreateTransactionAllocationRequest
}

export function useAddTransactionAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ transactionId, data }: AddTransactionAllocationMutationData) =>
      addTransactionAllocation(transactionId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financial-transactions"],
      })
    },
  })
}