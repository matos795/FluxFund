import { useQuery } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type UseAccountCashFlowReportParams = {
  startDate?: string
  endDate?: string
}

export function useAccountCashFlowReport(
  params: UseAccountCashFlowReportParams,
) {
  return useQuery({
    queryKey: ["account-cash-flow-report", params],
    queryFn: () => reportsApi.getAccountCashFlow(params),
  })
}