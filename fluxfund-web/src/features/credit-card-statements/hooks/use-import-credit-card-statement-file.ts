import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateFinancialData } from "@/features/financial-transactions/hooks/invalidate-financial-data"
import { importCreditCardStatementFile } from "../credit-card-statement-api"
import type { ImportProfile } from "@/utils/imports/import-profile"

type ImportCreditCardStatementFileData = {
  statementId: string
  profile: ImportProfile
  file: File
}

export function useImportCreditCardStatementFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ statementId, profile, file }: ImportCreditCardStatementFileData) =>
      importCreditCardStatementFile({
        statementId,
        profile,
        file,
      }),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-statements"] })
      queryClient.invalidateQueries({
        queryKey: ["credit-card-statement-items", variables.statementId],
      })
      invalidateFinancialData(queryClient)
    },
  })
}