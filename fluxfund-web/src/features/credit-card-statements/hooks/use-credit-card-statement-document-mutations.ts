import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  deleteCreditCardStatementDocument,
  uploadCreditCardStatementDocument,
} from "../credit-card-statement-api"

export function useUploadCreditCardStatementDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadCreditCardStatementDocument,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["credit-card-statements"],
      })
      queryClient.invalidateQueries({
        queryKey: [
          "credit-card-statement-document-library",
        ],
      })
    },
  })
}

export function useDeleteCreditCardStatementDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCreditCardStatementDocument,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["credit-card-statements"],
      })
      queryClient.invalidateQueries({
        queryKey: [
          "credit-card-statement-document-library",
        ],
      })
    },
  })
}