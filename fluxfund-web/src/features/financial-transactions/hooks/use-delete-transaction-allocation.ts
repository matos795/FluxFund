import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteTransactionAllocation } from "@/features/financial-transactions/financial-transaction-api"
import { invalidateFinancialData } from "./invalidate-financial-data"

type DeleteTransactionAllocationMutationData = {
  transactionId: string
  allocationId: string
}

export function useDeleteTransactionAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      transactionId,
      allocationId,
    }: DeleteTransactionAllocationMutationData) =>
      deleteTransactionAllocation(transactionId, allocationId),

    onSuccess: () => {
      invalidateFinancialData(queryClient)
    },
  })
}