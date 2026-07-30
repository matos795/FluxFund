import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  updateFinancialParty,
} from "../financial-party-api"

import type {
  UpdateFinancialPartyRequest,
} from "../financial-party-types"

export function useUpdateFinancialParty() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (
      data:
        UpdateFinancialPartyRequest,
    ) =>
      updateFinancialParty(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          ["financial-parties"],
      })

      queryClient.invalidateQueries({
        queryKey:
          ["beneficiaries"],
      })

      queryClient.invalidateQueries({
        queryKey:
          ["beneficiary-options"],
      })

      queryClient.invalidateQueries({
        queryKey:
          ["financial-party-options"],
      })
    },
  })
}