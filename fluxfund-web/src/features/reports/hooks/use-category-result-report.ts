import { useQuery } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type UseCategoryResultReportParams = {
  organizationId: string
  startDate?: string
  endDate?: string
}

export function useCategoryResultReport(
  params: UseCategoryResultReportParams,
) {
  return useQuery({
    queryKey: ["category-result-report", params],
    queryFn: () => reportsApi.getCategoryResult(params),
    enabled: Boolean(params.organizationId),
  })
}