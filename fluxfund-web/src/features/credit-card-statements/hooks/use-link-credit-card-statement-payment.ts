import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateFinancialData } from "@/features/financial-transactions/hooks/invalidate-financial-data"
import { linkCreditCardStatementPayment } from "../credit-card-statement-api"
import type { LinkCreditCardStatementPaymentRequest } from "../credit-card-statement-types"

type LinkCreditCardStatementPaymentData = {
  statementId: string
  paymentId: string
  data: LinkCreditCardStatementPaymentRequest
}

export function useLinkCreditCardStatementPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      statementId,
      paymentId,
      data,
    }: LinkCreditCardStatementPaymentData) =>
      linkCreditCardStatementPayment(statementId, paymentId, data),
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
