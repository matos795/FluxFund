import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateTransactionAllocation } from "@/features/financial-transactions/financial-transaction-api"
import type { UpdateTransactionAllocationRequest } from "@/features/financial-transactions/financial-transaction-types"

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
      queryClient.invalidateQueries({
        queryKey: ["financial-transactions"],
      })

      queryClient.invalidateQueries({
        queryKey: ["funds"],
      })
    },
  })
}