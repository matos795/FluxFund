import { useQuery } from "@tanstack/react-query"

import { dashboardApi } from "../dashboard-api"

type UseDashboardAlertsParams = {
  startDate?: string
  endDate?: string
}

export function useDashboardAlerts(params: UseDashboardAlertsParams) {
  return useQuery({
    queryKey: ["dashboard-alerts", params],
    queryFn: () => dashboardApi.getAlerts(params),
  })
}