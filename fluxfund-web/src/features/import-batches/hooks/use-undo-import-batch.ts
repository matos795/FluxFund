import {
    useMutation,
    useQueryClient,
} from "@tanstack/react-query"

import {
    invalidateFinancialData,
} from "@/features/financial-transactions/hooks/invalidate-financial-data"

import {
    undoImportBatch,
} from "../import-batch-api"

export function useUndoImportBatch() {

    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn:
            (
                batchId:
                    string,
            ) =>
                undoImportBatch(
                    batchId,
                ),

        onSuccess:
            async () => {

                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: [
                            "import-batches",
                        ],
                    }),

                    queryClient.invalidateQueries({
                        queryKey: [
                            "import-batch-undo-check",
                        ],
                    }),

                    invalidateFinancialData(
                        queryClient,
                    ),
                ])
            },
    })
}