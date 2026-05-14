import { useQuery } from "@tanstack/react-query"

import { getAccounts } from "@/features/accounts/accounts-api"

type UseAccountsParams = {
  page: number
  size: number
}

export function useAccounts({ page, size }: UseAccountsParams) {
  return useQuery({
    queryKey: ["accounts", { page, size }],
    queryFn: () =>
      getAccounts({
        page,
        size,
      }),
  })
}