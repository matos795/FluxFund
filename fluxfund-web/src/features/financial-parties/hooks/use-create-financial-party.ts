import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createFinancialParty,
} from "../financial-party-api"

import type {
  CreateFinancialPartyRequest,
} from "../financial-party-types"

export function useCreateFinancialParty() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (
      data:
        CreateFinancialPartyRequest,
    ) =>
      createFinancialParty(data),

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