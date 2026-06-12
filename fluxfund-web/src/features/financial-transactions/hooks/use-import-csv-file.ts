import { useMutation, useQueryClient } from "@tanstack/react-query"

import { importCsvFile } from "../financial-transaction-api"
import { invalidateFinancialData } from "./invalidate-financial-data"
import type { ImportProfile } from "@/utils/imports/import-profile"

type ImportCsvFileMutationData = {
  accountId: string
  profile: ImportProfile
  file: File
}

export function useImportCsvFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, profile, file }: ImportCsvFileMutationData) =>
      importCsvFile({
        accountId,
        profile,
        file,
      }),

    onSuccess: () => {
      invalidateFinancialData(queryClient)
    },
  })
}