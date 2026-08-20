import {
    httpClient,
} from "@/api/http-client"
import type { FinancialRelationshipReport } from "./financial-relationship-report-types"

type GetFinancialRelationshipReportParams = {
  startDate?: string
  endDate?: string
}

export async function getFinancialRelationshipReport(
  params: GetFinancialRelationshipReportParams,
) {
  const response =
    await httpClient.get<FinancialRelationshipReport>(
      "/reports/financial-relationships",
      {
        params,
      },
    )

  return response.data
}