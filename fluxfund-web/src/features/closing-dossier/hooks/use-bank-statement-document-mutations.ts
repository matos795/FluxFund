import { useMutation } from "@tanstack/react-query"

import {
  deleteBankStatementDocument,
  uploadBankStatementDocument,
} from "@/features/bank-statement-documents/bank-statement-document-api"

export function useUploadBankStatementDocument() {
  return useMutation({
    mutationFn: uploadBankStatementDocument,
  })
}

export function useDeleteBankStatementDocument() {
  return useMutation({
    mutationFn: deleteBankStatementDocument,
  })
}