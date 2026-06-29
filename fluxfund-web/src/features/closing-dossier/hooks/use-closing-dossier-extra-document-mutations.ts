import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  deleteClosingDossierExtraDocument,
  uploadClosingDossierExtraDocument,
} from "../closing-dossier-api"
import { closingDossierExtraDocumentsQueryKey } from "./use-closing-dossier-extra-documents"

export function useUploadClosingDossierExtraDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadClosingDossierExtraDocument,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: closingDossierExtraDocumentsQueryKey,
      })
    },
  })
}

export function useDeleteClosingDossierExtraDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteClosingDossierExtraDocument,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: closingDossierExtraDocumentsQueryKey,
      })
    },
  })
}