import { httpClient } from "@/api/http-client"
import type { CategoryResultReport } from "./reports-types"

type GetCategoryResultReportParams = {
  organizationId: string
  startDate?: string
  endDate?: string
}

export const reportsApi = {
  async getCategoryResult(params: GetCategoryResultReportParams) {
    const response = await httpClient.get<CategoryResultReport>(
      "/api/v1/reports/category-result",
      {
        params,
      },
    )

    return response.data
  },
}