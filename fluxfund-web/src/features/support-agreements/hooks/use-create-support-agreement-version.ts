import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createSupportAgreementVersion } from "../support-agreement-api"

export function useCreateSupportAgreementVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSupportAgreementVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["support-agreements"],
      })

      queryClient.invalidateQueries({
        queryKey: ["support-agreement-suggestions"],
      })

      queryClient.invalidateQueries({
        queryKey: ["accountability-report"],
      })

      queryClient.invalidateQueries({
        queryKey: ["accountability-by-account-report"],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "financial-forecast-report",
        ],
      })
    },
  })
}