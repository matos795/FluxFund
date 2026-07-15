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
    onSuccess: (_statement, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["credit-card-statements"],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "credit-card-statement-payments",
          variables.statementId,
        ],
      })

      invalidateFinancialData(queryClient)
    },
  })
}
