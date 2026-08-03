import {
  useQuery,
} from "@tanstack/react-query"

import {
  reportsApi,
} from "../reports-api"

import type {
  GetFinancialCommitmentMonthlyReportParams,
} from "../reports-types"

export function useFinancialCommitmentMonthlyReport(
  params:
    GetFinancialCommitmentMonthlyReportParams,
) {
  return useQuery({
    queryKey: [
      "financial-commitment-monthly-report",
      params,
    ],

    queryFn: () =>
      reportsApi
        .getFinancialCommitmentMonthly(
          params,
        ),

    enabled:
      Boolean(
        params.referenceMonth,
      ),
  })
}