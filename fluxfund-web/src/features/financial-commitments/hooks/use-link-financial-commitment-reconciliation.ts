import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  linkFinancialCommitmentReconciliation,
} from "../financial-commitment-api"

import {
  invalidateFinancialData,
} from "@/features/financial-transactions/hooks/invalidate-financial-data"

export function useLinkFinancialCommitmentReconciliation() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn:
      linkFinancialCommitmentReconciliation,

    onSuccess:
      async () => {
        await Promise.all([
          invalidateFinancialData(
            queryClient,
          ),

          queryClient.invalidateQueries({
            queryKey: [
              "financial-commitment-reconciliation",
            ],
          }),
        ])
      },
  })
}