import { useQuery } from "@tanstack/react-query"

import {
  getDraftTransferMatchSuggestion,
  type GetDraftTransferMatchSuggestionParams,
} from "../financial-transaction-api"

type Options = {
  enabled?: boolean
}

export function useDraftTransferMatchSuggestion(
  params: GetDraftTransferMatchSuggestionParams,
  options: Options = {},
) {
  return useQuery({
    queryKey: [
      "draft-transfer-match-suggestion",
      params.accountId,
      params.direction,
      params.transferDate,
      params.amount,
    ],

    queryFn: () =>
      getDraftTransferMatchSuggestion(params),

    enabled:
      options.enabled === true &&
      Boolean(params.accountId) &&
      Boolean(params.direction) &&
      Boolean(params.transferDate) &&
      params.amount > 0,
  })
}