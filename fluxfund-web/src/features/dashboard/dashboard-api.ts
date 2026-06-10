import { httpClient } from "@/api/http-client"
import type { DashboardSummary, ExpenseByCategoryItem, MonthlyCashFlowItem } from "./dashboard-types"

type GetDashboardSummaryParams = {
  startDate?: string
  endDate?: string
}

type GetDashboardChartParams = GetDashboardSummaryParams & {
  limit?: number
}

export const dashboardApi = {
  async getSummary(params: GetDashboardSummaryParams) {
    const response = await httpClient.get<DashboardSummary>(
      "/api/v1/dashboard/summary",
      {
        params,
      },
    )

    return response.data
  },

  async getMonthlyCashFlow(params: GetDashboardSummaryParams) {
    const response = await httpClient.get<MonthlyCashFlowItem[]>(
      "/api/v1/dashboard/monthly-cash-flow",
      {
        params,
      },
    )

    return response.data
  },

  async getExpensesByCategory(params: GetDashboardChartParams) {
    const response = await httpClient.get<ExpenseByCategoryItem[]>(
      "/api/v1/dashboard/expenses-by-category",
      {
        params,
      },
    )

    return response.data
  },
}