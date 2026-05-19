import { useMutation, useQueryClient } from "@tanstack/react-query"

import { importOfxFile } from "../financial-transaction-api"

type ImportOfxFileMutationData = {
  accountId: string
  file: File
}

export function useImportOfxFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, file }: ImportOfxFileMutationData) =>
      importOfxFile({ accountId, file }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financial-transactions"],
      })
    },
  })
}