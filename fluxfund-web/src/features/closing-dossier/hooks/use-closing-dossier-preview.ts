import { useMutation } from "@tanstack/react-query"

import { previewClosingDossier } from "../closing-dossier-api"

export function useClosingDossierPreview() {
  return useMutation({
    mutationFn: previewClosingDossier,
  })
}