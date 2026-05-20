import { httpClient } from "@/api/http-client"
import type { DashboardSummary } from "./dashboard-types"

type GetDashboardSummaryParams = {
  organizationId: string
  startDate?: string
  endDate?: string
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
}