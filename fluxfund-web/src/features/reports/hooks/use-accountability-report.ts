import { useQuery } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type UseAccountabilityReportParams = {
  organizationId: string
  startDate?: string
  endDate?: string
}

export function useAccountabilityReport(
  params: UseAccountabilityReportParams,
) {
  return useQuery({
    queryKey: ["accountability-report", params],
    queryFn: () => reportsApi.getAccountability(params),
    enabled: Boolean(params.organizationId),
  })
}