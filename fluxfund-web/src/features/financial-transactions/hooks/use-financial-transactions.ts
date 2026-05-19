import { useQuery } from "@tanstack/react-query"
import { getFinancialTransactions } from "../financial-transaction-api"

type UseFinancialTransactionsParams = {
  page: number
  size: number
  type?: string
  status?: string
  source?: string
  accountId?: string
  categoryId?: string
  description?: string
  settlementDateFrom?: string
  settlementDateTo?: string
  onlyUnclassified?: boolean
  onlyUnallocated?: boolean
}

export function useFinancialTransactions(params: UseFinancialTransactionsParams) {
  return useQuery({
    queryKey: ["financial-transactions", params],
    queryFn: () => getFinancialTransactions(params),
  })
}