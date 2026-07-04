import { useMutation } from "@tanstack/react-query"

import { reportsApi } from "../reports-api"

export function useExportCreditCardStatementPdf() {
  return useMutation({
    mutationFn: (statementId: string) =>
      reportsApi.exportCreditCardStatementPdf(statementId),
  })
}