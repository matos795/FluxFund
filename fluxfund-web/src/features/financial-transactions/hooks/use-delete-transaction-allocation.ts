import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteTransactionAllocation } from "@/features/financial-transactions/financial-transaction-api"

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
      queryClient.invalidateQueries({
        queryKey: ["financial-transactions"],
      })
    },
  })
}