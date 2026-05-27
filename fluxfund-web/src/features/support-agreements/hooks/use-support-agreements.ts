import { useQuery } from "@tanstack/react-query"
import {
  getSupportAgreements,
  type GetSupportAgreementsParams,
} from "../support-agreement-api"

export function useSupportAgreements(params: GetSupportAgreementsParams) {
  return useQuery({
    queryKey: ["support-agreements", params],
    queryFn: () => getSupportAgreements(params),
  })
}