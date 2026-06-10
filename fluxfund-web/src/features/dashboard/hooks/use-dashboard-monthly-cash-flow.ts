import { useQuery } from "@tanstack/react-query"

import { dashboardApi } from "../dashboard-api"

type UseDashboardMonthlyCashFlowParams = {
  startDate?: string
  endDate?: string
}

export function useDashboardMonthlyCashFlow(
  params: UseDashboardMonthlyCashFlowParams,
) {
  return useQuery({
    queryKey: ["dashboard-monthly-cash-flow", params],
    queryFn: () => dashboardApi.getMonthlyCashFlow(params),
  })
}