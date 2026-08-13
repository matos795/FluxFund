import {
    useQuery,
} from "@tanstack/react-query"

import {
    getImportBatchUndoCheck,
} from "../import-batch-api"

export function useImportBatchUndoCheck({
    batchId,
    enabled,
}: {
    batchId:
    string

    enabled:
    boolean
}) {

    return useQuery({
        queryKey: [
            "import-batch-undo-check",
            batchId,
        ],

        queryFn: () =>
            getImportBatchUndoCheck(
                batchId,
            ),

        enabled:
            enabled &&
            Boolean(
                batchId,
            ),

        staleTime:
            0,

        refetchOnMount:
            "always",

        refetchOnWindowFocus:
            false,
    })
}