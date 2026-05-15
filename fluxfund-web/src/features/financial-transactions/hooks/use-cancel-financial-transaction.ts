import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cancelFinancialTransaction } from "../financial-transaction-api"

export function useCancelFinancialTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cancelFinancialTransaction(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financial-transactions"],
      })
    },
  })
}