import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "../dashboard-api"

type UseDashboardSummaryParams = {
  startDate?: string
  endDate?: string
}

export function useDashboardSummary(params: UseDashboardSummaryParams) {
  return useQuery({
    queryKey: ["dashboard-summary", params],
    queryFn: () => dashboardApi.getSummary(params),
  })
}