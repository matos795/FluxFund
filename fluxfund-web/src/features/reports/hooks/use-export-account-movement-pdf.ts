import { useMutation } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

type ExportAccountMovementPdfParams = {
  accountId: string
  startDate?: string
  endDate?: string
}

export function useExportAccountMovementPdf() {
  return useMutation({
    mutationFn: (params: ExportAccountMovementPdfParams) =>
      reportsApi.exportAccountMovementPdf(params),
  })
}