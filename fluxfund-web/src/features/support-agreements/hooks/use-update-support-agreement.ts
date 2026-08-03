import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateSupportAgreement } from "../support-agreement-api"

export function useUpdateSupportAgreement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSupportAgreement,
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
    },
  })
}