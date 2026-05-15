import { useQuery } from "@tanstack/react-query"
import { getFinancialTransactions } from "../financial-transaction-api"

type UseFinancialTransactionsParams = {
  page: number
  size: number
}

export function useFinancialTransactions({ page, size }: UseFinancialTransactionsParams) {
  return useQuery({
    queryKey: ["financial-transactions", { page, size }],
    queryFn: () => getFinancialTransactions({ page, size, }),
  })
}