import { useQuery } from "@tanstack/react-query"
import {
  getSupportAgreementSuggestions,
  type GetSupportAgreementSuggestionsParams,
} from "../support-agreement-api"

type UseSupportAgreementSuggestionsOptions = {
  enabled?: boolean
}

export function useSupportAgreementSuggestions(
  params: GetSupportAgreementSuggestionsParams,
  options?: UseSupportAgreementSuggestionsOptions,
) {
  return useQuery({
    queryKey: ["support-agreement-suggestions", params],
    queryFn: () => getSupportAgreementSuggestions(params),
    enabled: options?.enabled ?? Boolean(params.beneficiaryId),
  })
}