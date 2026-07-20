import { useQuery } from "@tanstack/react-query"

import { getTransferMatchSuggestion } from "../financial-transaction-api"

type Options = {
  enabled?: boolean
}

export function useTransferMatchSuggestion(
  transactionId: string,
  options: Options = {},
) {
  return useQuery({
    queryKey: [
      "transfer-match-suggestion",
      transactionId,
    ],

    queryFn: () =>
      getTransferMatchSuggestion(transactionId),

    enabled:
      options.enabled !== false &&
      Boolean(transactionId),
  })
}