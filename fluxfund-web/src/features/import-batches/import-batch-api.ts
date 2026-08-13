import {
    httpClient,
} from "@/api/http-client"

import type {
    PageResponse,
} from "@/types/page-response"

import type {
    GetImportBatchesParams,
    ImportBatch,
    ImportBatchUndoCheck,
    ImportBatchUndoResponse,
} from "./import-batch-types"

export async function getImportBatches({
    page = 0,
    size = 10,
}: GetImportBatchesParams) {

    const response =
        await httpClient.get<
            PageResponse<ImportBatch>
        >(
            "/api/v1/import-batches",
            {
                params: {
                    page,
                    size,
                    sort:
                        "importedAt,desc",
                },
            },
        )

    return response.data
}

export async function getImportBatchUndoCheck(
    batchId:
        string,
) {

    const response =
        await httpClient.get<
            ImportBatchUndoCheck
        >(
            `/api/v1/import-batches/${batchId}/undo-check`,
        )

    return response.data
}

export async function undoImportBatch(
    batchId:
        string,
) {

    const response =
        await httpClient.post<
            ImportBatchUndoResponse
        >(
            `/api/v1/import-batches/${batchId}/undo`,
        )

    return response.data
}