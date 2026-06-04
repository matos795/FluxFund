import { useMutation, useQueryClient } from "@tanstack/react-query"

import { classifyFinancialTransaction } from "../financial-transaction-api"
import type { ClassifyFinancialTransactionRequest } from "../financial-transaction-types"
import { invalidateFinancialData } from "./invalidate-financial-data"

type ClassifyFinancialTransactionMutationData = {
  transactionId: string
  data: ClassifyFinancialTransactionRequest
}

export function useClassifyFinancialTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ transactionId, data }: ClassifyFinancialTransactionMutationData) =>
      classifyFinancialTransaction({
        transactionId,
        data,
      }),

    onSuccess: (_, variables) => {
      invalidateFinancialData(queryClient)

      queryClient.invalidateQueries({
        queryKey: ["financial-transaction", variables.transactionId],
      })
    },
  })
}