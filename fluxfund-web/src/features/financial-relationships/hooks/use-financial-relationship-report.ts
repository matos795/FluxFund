import { useQuery } from "@tanstack/react-query"
import { getFinancialRelationshipReport } from "../financial-relationship-report-api"

type UseFinancialRelationshipReportParams = {
  startDate?: string
  endDate?: string
}

export function useFinancialRelationshipReport({
  startDate,
  endDate,
}: UseFinancialRelationshipReportParams) {
  return useQuery({
    queryKey: [
      "reports",
      "financial-relationships",
      startDate ?? null,
      endDate ?? null,
    ],
    queryFn: () =>
      getFinancialRelationshipReport({
        startDate,
        endDate,
      }),
  })
}