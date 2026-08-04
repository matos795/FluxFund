import {
    useMutation,
    useQueryClient,
} from "@tanstack/react-query"

import {
    cancelReceipt,
    createReceiptDraft,
    deleteReceiptDraft,
    issueReceipt,
    reissueReceipt,
    updateReceiptDraft,
} from "../receipt-api"

export function useReceiptMutations() {
    const queryClient =
        useQueryClient()

    async function invalidate() {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: [
                    "receipts",
                ],
            }),

            queryClient.invalidateQueries({
                queryKey: [
                    "financial-parties-360",
                ],
            }),
        ])
    }

    const createMutation =
        useMutation({
            mutationFn:
                createReceiptDraft,

            onSuccess:
                invalidate,
        })

    const updateMutation =
        useMutation({
            mutationFn:
                updateReceiptDraft,

            onSuccess:
                invalidate,
        })

    const deleteMutation =
        useMutation({
            mutationFn:
                deleteReceiptDraft,

            onSuccess:
                invalidate,
        })

    const issueMutation =
        useMutation({
            mutationFn:
                issueReceipt,

            onSuccess:
                invalidate,
        })

    const cancelMutation =
        useMutation({
            mutationFn:
                cancelReceipt,

            onSuccess:
                invalidate,
        })

    const reissueMutation =
        useMutation({
            mutationFn:
                reissueReceipt,

            onSuccess:
                invalidate,
        })

    return {
        createMutation,
        updateMutation,
        deleteMutation,
        issueMutation,
        cancelMutation,
        reissueMutation,
    }
}