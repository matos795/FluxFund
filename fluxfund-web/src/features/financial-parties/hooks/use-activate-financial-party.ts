import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  activateFinancialParty,
} from "../financial-party-api"

export function useActivateFinancialParty() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      activateFinancialParty(id),

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