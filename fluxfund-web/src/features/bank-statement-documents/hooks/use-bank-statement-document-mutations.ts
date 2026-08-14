import {
    useMutation,
    useQueryClient,
} from "@tanstack/react-query"

import {
    deleteBankStatementDocument,
    uploadBankStatementDocument,
} from "../bank-statement-document-api"

export function useUploadBankStatementDocument() {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn:
            uploadBankStatementDocument,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: [
                    "bank-statement-documents-library",
                ],
            })
        },
    })
}

export function useDeleteBankStatementDocument() {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn:
            deleteBankStatementDocument,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: [
                    "bank-statement-documents-library",
                ],
            })
        },
    })
}