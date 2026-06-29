import { useQuery } from "@tanstack/react-query"

import { getClosingDossierExtraDocuments } from "../closing-dossier-api"

export const closingDossierExtraDocumentsQueryKey = [
  "closing-dossier-extra-documents",
] as const

export function useClosingDossierExtraDocuments(
  periodStartDate: string,
  periodEndDate: string,
) {
  return useQuery({
    queryKey: [
      ...closingDossierExtraDocumentsQueryKey,
      periodStartDate,
      periodEndDate,
    ],

    queryFn: () =>
      getClosingDossierExtraDocuments({
        periodStartDate,
        periodEndDate,
      }),

    enabled: Boolean(
      periodStartDate &&
        periodEndDate &&
        periodStartDate <= periodEndDate,
    ),
  })
}