import { useQuery } from "@tanstack/react-query"

import { getLegalStatus } from "../legal-api"

export const legalStatusQueryKey = [
    "legal",
    "status",
] as const

export function useLegalStatus(
    enabled = true,
) {
    return useQuery({
        queryKey: legalStatusQueryKey,
        queryFn: getLegalStatus,
        enabled,
        staleTime: 0,
    })
}