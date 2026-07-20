import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { pairTransferTransactions } from "../financial-transaction-api"
import { invalidateFinancialData } from "./invalidate-financial-data"

type MutationData = {
  transactionId: string
  matchingTransactionId: string
}

export function usePairTransferTransactions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      transactionId,
      matchingTransactionId,
    }: MutationData) =>
      pairTransferTransactions(
        transactionId,
        matchingTransactionId,
      ),

    onSuccess: (_transactions, variables) => {
      invalidateFinancialData(queryClient)

      queryClient.invalidateQueries({
        queryKey: [
          "financial-transaction",
          variables.transactionId,
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "financial-transaction",
          variables.matchingTransactionId,
        ],
      })

      queryClient.invalidateQueries({
        queryKey: ["transfer-match-suggestion"],
      })
    },
  })
}