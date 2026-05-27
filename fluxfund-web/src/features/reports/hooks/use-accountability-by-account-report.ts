import { useQuery } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type UseAccountabilityByAccountReportParams = {
  organizationId: string
  startDate?: string
  endDate?: string
}

export function useAccountabilityByAccountReport(
  params: UseAccountabilityByAccountReportParams,
  enabled = true,
) {
  return useQuery({
    queryKey: ["accountability-by-account-report", params],
    queryFn: () => reportsApi.getAccountabilityByAccount(params),
    enabled: enabled && Boolean(params.organizationId),
  })
}