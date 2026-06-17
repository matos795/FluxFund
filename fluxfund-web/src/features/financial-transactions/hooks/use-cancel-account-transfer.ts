import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cancelAccountTransfer } from "../financial-transaction-api"
import { invalidateFinancialData } from "./invalidate-financial-data"

export function useCancelAccountTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transactionId: string) => cancelAccountTransfer(transactionId),

    onSuccess: () => {
      invalidateFinancialData(queryClient)
    },
  })
}