import { useQuery } from "@tanstack/react-query"

import { getFundTransfers } from "../fund-api"

type UseFundTransfersParams = {
  page: number
  size: number
}

export function useFundTransfers({ page, size }: UseFundTransfersParams) {
  return useQuery({
    queryKey: ["fund-transfers", { page, size }],
    queryFn: () =>
      getFundTransfers({
        page,
        size,
      }),
  })
}