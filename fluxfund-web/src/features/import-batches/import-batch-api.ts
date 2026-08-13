import {
  httpClient,
} from "@/api/http-client"

import type {
  PageResponse,
} from "@/types/page-response"

import type {
  GetImportBatchesParams,
  ImportBatch,
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