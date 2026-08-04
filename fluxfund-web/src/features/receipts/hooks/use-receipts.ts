import {
  useQuery,
} from "@tanstack/react-query"

import {
  getReceipts,
} from "../receipt-api"

import type {
  GetReceiptsParams,
} from "../receipt-types"

export function useReceipts(
  params:
    GetReceiptsParams,
) {
  return useQuery({
    queryKey: [
      "receipts",
      params,
    ],

    queryFn: () =>
      getReceipts(
        params,
      ),
  })
}