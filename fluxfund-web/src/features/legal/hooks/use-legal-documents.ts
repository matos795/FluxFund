import { useQuery } from "@tanstack/react-query"

import { getLegalDocuments } from "../legal-api"

export const legalDocumentsQueryKey = [
    "legal",
    "documents",
] as const

export function useLegalDocuments(
    enabled = true,
) {
    return useQuery({
        queryKey: legalDocumentsQueryKey,
        queryFn: getLegalDocuments,
        enabled,
    })
}