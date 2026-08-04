import {
  useQuery,
} from "@tanstack/react-query"

import {
  reportsApi,
} from "../reports-api"

import type {
  GetFinancialForecastReportParams,
} from "../reports-types"

export function useFinancialForecastReport(
  params:
    GetFinancialForecastReportParams,
) {
  return useQuery({
    queryKey: [
      "financial-forecast-report",
      params,
    ],

    queryFn: () =>
      reportsApi
        .getFinancialForecast(
          params,
        ),

    enabled:
      Boolean(
        params.startMonth,
      ),
  })
}