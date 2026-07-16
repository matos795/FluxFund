import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateFinancialData } from "@/features/financial-transactions/hooks/invalidate-financial-data"
import { importCreditCardStatementOfx } from "../credit-card-statement-api"

type ImportCreditCardStatementOfxData = {
  statementId: string
  file: File
}

export function useImportCreditCardStatementOfx() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ statementId, file }: ImportCreditCardStatementOfxData) =>
      importCreditCardStatementOfx({ statementId, file }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-statements"] })
      queryClient.invalidateQueries({
        queryKey: [
          "credit-card-statement-payments",
          variables.statementId,
        ],
      })
      invalidateFinancialData(queryClient)
    },
  })
}