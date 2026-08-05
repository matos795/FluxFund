import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  deactivateFinancialParty,
} from "../financial-party-api"

export function useDeactivateFinancialParty() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      deactivateFinancialParty(id),

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

      queryClient.invalidateQueries({
        queryKey: [
          "financial-parties-360",
        ],
      })
    },
  })
}