import { useQuery } from "@tanstack/react-query"

import { getAccountOptions } from "../accounts-api"

export function useAccountOptions() {
  return useQuery({
    queryKey: ["account-options"],
    queryFn: getAccountOptions,
  })
}