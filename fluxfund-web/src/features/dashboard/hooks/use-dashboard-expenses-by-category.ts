import { useQuery } from "@tanstack/react-query"

import { dashboardApi } from "../dashboard-api"

type UseDashboardExpensesByCategoryParams = {
  startDate?: string
  endDate?: string
  limit?: number
}

export function useDashboardExpensesByCategory(
  params: UseDashboardExpensesByCategoryParams,
) {
  return useQuery({
    queryKey: ["dashboard-expenses-by-category", params],
    queryFn: () => dashboardApi.getExpensesByCategory(params),
  })
}