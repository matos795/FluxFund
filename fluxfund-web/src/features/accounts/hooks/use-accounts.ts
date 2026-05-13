import { useQuery } from "@tanstack/react-query"

import { getAccounts } from "@/features/accounts/accounts-api"

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () =>
      getAccounts({
        page: 0,
        size: 10,
      }),
  })
}