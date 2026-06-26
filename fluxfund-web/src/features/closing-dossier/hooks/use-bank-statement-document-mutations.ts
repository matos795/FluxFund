import { useMutation } from "@tanstack/react-query"

import {
  deleteBankStatementDocument,
  uploadBankStatementDocument,
} from "../closing-dossier-api"

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