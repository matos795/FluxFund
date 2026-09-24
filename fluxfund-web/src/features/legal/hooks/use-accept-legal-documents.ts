import {
    useMutation,
    useQueryClient,
} from "@tanstack/react-query"

import { acceptLegalDocuments } from "../legal-api"
import { legalStatusQueryKey } from "./use-legal-status"

export function useAcceptLegalDocuments() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: acceptLegalDocuments,

        onSuccess: (status) => {
            queryClient.setQueryData(
                legalStatusQueryKey,
                status,
            )
        },
    })
}