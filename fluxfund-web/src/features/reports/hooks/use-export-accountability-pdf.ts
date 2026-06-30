import { useMutation } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type ExportAccountabilityPdfParams = {
  startDate?: string
  endDate?: string
}

export function useExportAccountabilityPdf() {
  return useMutation({
    mutationFn: (params: ExportAccountabilityPdfParams) =>
      reportsApi.exportAccountabilityPdf(params),
  })
}