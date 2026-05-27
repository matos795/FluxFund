import { httpClient } from "@/api/http-client"
import type { AccountabilityByAccountReport, AccountabilityReport, CategoryResultReport, FundReport } from "./reports-types"

type GetCategoryResultReportParams = {
  organizationId: string
  startDate?: string
  endDate?: string
}

type GetFundReportParams = {
  organizationId: string
  startDate?: string
  endDate?: string
}

type GetAccountabilityReportParams = {
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

  async getFunds(params: GetFundReportParams) {
    const response = await httpClient.get<FundReport>(
      "/api/v1/reports/funds",
      {
        params,
      },
    )

    return response.data
  },

  async getAccountability(params: GetAccountabilityReportParams) {
    const response = await httpClient.get<AccountabilityReport>(
      "/api/v1/reports/accountability",
      {
        params,
      },
    )

    return response.data
  },

  async getAccountabilityByAccount(params: GetAccountabilityReportParams) {
    const response = await httpClient.get<AccountabilityByAccountReport>(
      "/api/v1/reports/accountability/by-account",
      {
        params,
      },
    )

    return response.data
  },
}