import { useQuery } from "@tanstack/react-query"

import { getCreditCardStatements } from "../credit-card-statement-api"
import type { CreditCardStatementStatus } from "../credit-card-statement-types"

type UseCreditCardStatementsParams = {
  page: number
  size: number
  creditCardAccountId?: string
  status?: CreditCardStatementStatus
}

export function useCreditCardStatements(params: UseCreditCardStatementsParams) {
  return useQuery({
    queryKey: ["credit-card-statements", params],
    queryFn: () => getCreditCardStatements(params),
  })
}
