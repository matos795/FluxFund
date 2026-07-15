import { useQuery } from "@tanstack/react-query"

import { getCreditCardStatementPayments } from "../credit-card-statement-api"

export function useCreditCardStatementPayments(
  statementId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "credit-card-statement-payments",
      statementId,
    ],
    enabled: Boolean(statementId) && enabled,
    queryFn: () =>
      getCreditCardStatementPayments(statementId),
  })
}