import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "../dashboard-api"

type UseDashboardSummaryParams = {
  organizationId: string
  startDate?: string
  endDate?: string
}

export function useDashboardSummary(params: UseDashboardSummaryParams) {
  return useQuery({
    queryKey: ["dashboard-summary", params],
    queryFn: () => dashboardApi.getSummary(params),
    enabled: Boolean(params.organizationId),
  })
}