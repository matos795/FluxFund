import { useQuery } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type UsePendingItemsReportParams = {
  limit?: number
}

export function usePendingItemsReport({
  limit = 10,
}: UsePendingItemsReportParams = {}) {
  return useQuery({
    queryKey: ["pending-items-report", { limit }],
    queryFn: () => reportsApi.getPendingItems({ limit }),
  })
}