import { httpClient } from "@/api/http-client"
import type { DashboardActionItems, DashboardAlerts, DashboardSummary, ExpenseByCategoryItem, FundOverviewItem, MonthlyCashFlowItem } from "./dashboard-types"

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

  async getFundsOverview(params: GetDashboardChartParams) {
    const response = await httpClient.get<FundOverviewItem[]>(
      "/api/v1/dashboard/funds-overview",
      {
        params,
      },
    )

    return response.data
  },

  async getAlerts(params: GetDashboardSummaryParams) {
    const response = await httpClient.get<DashboardAlerts>(
      "/api/v1/dashboard/alerts",
      {
        params,
      },
    )

    return response.data
  },

  async getActionItems(params: GetDashboardChartParams) {
    const response = await httpClient.get<DashboardActionItems>(
      "/api/v1/dashboard/action-items",
      {
        params,
      },
    )

    return response.data
  },
}