import { useMutation } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type ExportAccountabilityExcelParams = {
  organizationId: string
  startDate?: string
  endDate?: string
}

export function useExportAccountabilityExcel() {
  return useMutation({
    mutationFn: (params: ExportAccountabilityExcelParams) =>
      reportsApi.exportAccountabilityExcel(params),
  })
}