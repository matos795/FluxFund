import { useQuery } from "@tanstack/react-query"

import { dashboardApi } from "../dashboard-api"

type UseDashboardFundsOverviewParams = {
  startDate?: string
  endDate?: string
  limit?: number
}

export function useDashboardFundsOverview(
  params: UseDashboardFundsOverviewParams,
) {
  return useQuery({
    queryKey: ["dashboard-funds-overview", params],
    queryFn: () => dashboardApi.getFundsOverview(params),
  })
}