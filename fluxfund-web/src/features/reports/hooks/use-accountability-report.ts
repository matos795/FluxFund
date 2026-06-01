import { useQuery } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type UseAccountabilityReportParams = {
  startDate?: string
  endDate?: string
}

export function useAccountabilityReport(
  params: UseAccountabilityReportParams,
) {
  return useQuery({
    queryKey: ["accountability-report", params],
    queryFn: () => reportsApi.getAccountability(params),
  })
}