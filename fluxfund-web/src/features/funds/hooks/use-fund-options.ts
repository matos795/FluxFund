import { useQuery } from "@tanstack/react-query"

import { getFundOptions } from "../fund-api"

export function useFundOptions() {
  return useQuery({
    queryKey: ["fund-options"],
    queryFn: getFundOptions,
  })
}