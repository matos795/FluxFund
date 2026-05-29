import { useMutation } from "@tanstack/react-query"

import {
  exportSettledFinancialTransactionsExcel,
  type ExportSettledFinancialTransactionsParams,
} from "../financial-transaction-api"

export function useExportSettledFinancialTransactionsExcel() {
  return useMutation({
    mutationFn: (params: ExportSettledFinancialTransactionsParams) =>
      exportSettledFinancialTransactionsExcel(params),
  })
}