import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateFinancialData } from "@/features/financial-transactions/hooks/invalidate-financial-data"
import { markCreditCardStatementPaymentAsOpeningBalance } from "../credit-card-statement-api"

type MarkCreditCardPaymentAsOpeningBalanceData = {
  statementId: string
  paymentId: string
}

export function useMarkCreditCardPaymentAsOpeningBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      statementId,
      paymentId,
    }: MarkCreditCardPaymentAsOpeningBalanceData) =>
      markCreditCardStatementPaymentAsOpeningBalance(
        statementId,
        paymentId,
      ),

    onSuccess: (_payment, variables) => {
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