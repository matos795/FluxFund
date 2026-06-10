import { useQuery } from "@tanstack/react-query"

import { getFinancialTransactionById } from "../financial-transaction-api"

type UseFinancialTransactionParams = {
  id?: string | null
}

export function useFinancialTransaction({ id }: UseFinancialTransactionParams) {
  return useQuery({
    queryKey: ["financial-transaction", id],
    queryFn: () => getFinancialTransactionById(id!),
    enabled: Boolean(id),
  })
}