import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cancelCreditCardStatement } from "../credit-card-statement-api"
import { invalidateFinancialData } from "@/features/financial-transactions/hooks/invalidate-financial-data"

export function useCancelCreditCardStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (statementId: string) => cancelCreditCardStatement(statementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-statements"] })
      invalidateFinancialData(queryClient)
    },
  })
}
