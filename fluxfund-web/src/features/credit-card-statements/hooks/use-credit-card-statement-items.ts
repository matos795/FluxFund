import { useQuery } from "@tanstack/react-query"

import { getCreditCardStatementItems } from "../credit-card-statement-api"

export function useCreditCardStatementItems(statementId: string, enabled = true) {
  return useQuery({
    queryKey: ["credit-card-statement-items", statementId],
    queryFn: () => getCreditCardStatementItems(statementId),
    enabled: Boolean(statementId) && enabled,
  })
}