import { useQuery } from "@tanstack/react-query"

import { getClassificationSuggestion } from "../financial-transaction-api"

type UseClassificationSuggestionOptions = {
  enabled?: boolean
}

export function useClassificationSuggestion(
  transactionId: string,
  options?: UseClassificationSuggestionOptions,
) {
  return useQuery({
    queryKey: ["classification-suggestion", transactionId],
    queryFn: () => getClassificationSuggestion(transactionId),
    enabled: options?.enabled ?? Boolean(transactionId),
  })
}