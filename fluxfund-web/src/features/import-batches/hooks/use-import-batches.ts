import {
  useQuery,
} from "@tanstack/react-query"

import {
  getImportBatches,
} from "../import-batch-api"

import type {
  GetImportBatchesParams,
} from "../import-batch-types"

export function useImportBatches(
  params:
    GetImportBatchesParams,
) {

  return useQuery({
    queryKey: [
      "import-batches",
      params,
    ],

    queryFn: () =>
      getImportBatches(
        params,
      ),
  })
}