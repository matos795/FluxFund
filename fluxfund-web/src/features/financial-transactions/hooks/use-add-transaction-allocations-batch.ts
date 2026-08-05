import { useMutation, useQueryClient } from "@tanstack/react-query"

import { addTransactionAllocationsBatch } from "../financial-transaction-api"
import type { CreateTransactionAllocationRequest } from "../financial-transaction-types"
import { invalidateFinancialData } from "./invalidate-financial-data"

type AddTransactionAllocationsBatchMutationData = {
  transactionId: string
  allocations: CreateTransactionAllocationRequest[]
}

export function useAddTransactionAllocationsBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      transactionId,
      allocations,
    }: AddTransactionAllocationsBatchMutationData) =>
      addTransactionAllocationsBatch(transactionId, allocations),

    onSuccess: () =>
      invalidateFinancialData(
        queryClient,
      ),
  })
}