import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createAccountTransfer } from "../financial-transaction-api"
import type { CreateAccountTransferRequest } from "../financial-transaction-types"
import { invalidateFinancialData } from "./invalidate-financial-data"

export function useCreateAccountTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAccountTransferRequest) =>
      createAccountTransfer(data),

    onSuccess: () => {
      invalidateFinancialData(queryClient)
    },
  })
}