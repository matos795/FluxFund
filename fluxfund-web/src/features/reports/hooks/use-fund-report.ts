import { useQuery } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type UseFundReportParams = {
  organizationId: string
  startDate?: string
  endDate?: string
}

export function useFundReport(params: UseFundReportParams) {
  return useQuery({
    queryKey: ["fund-report", params],
    queryFn: () => reportsApi.getFunds(params),
    enabled: Boolean(params.organizationId),
  })
}