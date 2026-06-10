import { useQuery } from "@tanstack/react-query"

import { dashboardApi } from "../dashboard-api"

type UseDashboardActionItemsParams = {
  startDate?: string
  endDate?: string
  limit?: number
}

export function useDashboardActionItems(params: UseDashboardActionItemsParams) {
  return useQuery({
    queryKey: ["dashboard-action-items", params],
    queryFn: () => dashboardApi.getActionItems(params),
  })
}