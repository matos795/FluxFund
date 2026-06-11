import { useMutation, useQueryClient } from "@tanstack/react-query"

import { payCreditCardStatement } from "../credit-card-statement-api"
import type { PayCreditCardStatementRequest } from "../credit-card-statement-types"
import { invalidateFinancialData } from "@/features/financial-transactions/hooks/invalidate-financial-data"

type PayCreditCardStatementMutationData = {
  statementId: string
  data: PayCreditCardStatementRequest
}

export function usePayCreditCardStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ statementId, data }: PayCreditCardStatementMutationData) =>
      payCreditCardStatement(statementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-statements"] })
      invalidateFinancialData(queryClient)
    },
  })
}
