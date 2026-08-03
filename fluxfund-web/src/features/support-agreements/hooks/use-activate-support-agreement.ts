import { useMutation, useQueryClient } from "@tanstack/react-query"

import { activateSupportAgreement } from "../support-agreement-api"

export function useActivateSupportAgreement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: activateSupportAgreement,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["support-agreements"],
      })
      queryClient.invalidateQueries({
        queryKey: ["accountability-report"],
      })
      queryClient.invalidateQueries({
        queryKey: ["accountability-by-account-report"],
      })
      queryClient.invalidateQueries({
        queryKey: [
          "financial-commitments",
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          "financial-commitment-allocation-suggestions",
        ],
      })
    },
  })
}