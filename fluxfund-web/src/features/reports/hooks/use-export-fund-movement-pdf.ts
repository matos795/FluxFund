import { useMutation } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type ExportFundMovementPdfParams = {
  startDate?: string
  endDate?: string
}

export function useExportFundMovementPdf() {
  return useMutation({
    mutationFn: (params: ExportFundMovementPdfParams) =>
      reportsApi.exportFundMovementPdf(params),
  })
}