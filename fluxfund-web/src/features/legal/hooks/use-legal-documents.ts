import { useQuery } from "@tanstack/react-query"

import { getLegalDocuments } from "../legal-api"

export const legalDocumentsQueryKey = [
    "legal",
    "documents",
] as const

export function useLegalDocuments() {
    return useQuery({
        queryKey: legalDocumentsQueryKey,
        queryFn: getLegalDocuments,
    })
}