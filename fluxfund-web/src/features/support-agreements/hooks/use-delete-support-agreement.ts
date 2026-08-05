import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteSupportAgreement } from "../support-agreement-api"

export function useDeleteSupportAgreement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSupportAgreement,
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
          "financial-forecast-report",
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "financial-parties-360",
        ],
      })
    },
  })
}