import { useMutation } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type ExportSettledIncomePdfParams = {
  startDate?: string
  endDate?: string
}

export function useExportSettledIncomePdf() {
  return useMutation({
    mutationFn: (params: ExportSettledIncomePdfParams) =>
      reportsApi.exportSettledIncomePdf(params),
  })
}