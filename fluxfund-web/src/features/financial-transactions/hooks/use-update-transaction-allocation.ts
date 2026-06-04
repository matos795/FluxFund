import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateTransactionAllocation } from "@/features/financial-transactions/financial-transaction-api"
import type { UpdateTransactionAllocationRequest } from "@/features/financial-transactions/financial-transaction-types"
import { invalidateFinancialData } from "./invalidate-financial-data"

type UpdateTransactionAllocationMutationData = {
  transactionId: string
  allocationId: string
  data: UpdateTransactionAllocationRequest
}

export function useUpdateTransactionAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      transactionId,
      allocationId,
      data,
    }: UpdateTransactionAllocationMutationData) =>
      updateTransactionAllocation(transactionId, allocationId, data),

    onSuccess: () => {
      invalidateFinancialData(queryClient)
    },
  })
}