import { useMutation } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type ExportSettledExpensePdfParams = {
  startDate?: string
  endDate?: string
}

export function useExportSettledExpensePdf() {
  return useMutation({
    mutationFn: (params: ExportSettledExpensePdfParams) =>
      reportsApi.exportSettledExpensePdf(params),
  })
}