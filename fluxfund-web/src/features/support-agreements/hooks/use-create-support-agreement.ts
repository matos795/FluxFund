import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createSupportAgreement } from "../support-agreement-api"

export function useCreateSupportAgreement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSupportAgreement,
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