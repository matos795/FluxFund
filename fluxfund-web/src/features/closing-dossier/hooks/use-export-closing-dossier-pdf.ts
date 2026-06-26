import { useMutation } from "@tanstack/react-query"

import { exportClosingDossierPdf } from "../closing-dossier-api"

export function useExportClosingDossierPdf() {
  return useMutation({
    mutationFn: exportClosingDossierPdf,
  })
}