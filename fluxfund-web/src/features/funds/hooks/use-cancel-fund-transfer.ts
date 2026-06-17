import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cancelFundTransfer } from "../fund-api"

export function useCancelFundTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cancelFundTransfer(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-transfers"] })
      queryClient.invalidateQueries({ queryKey: ["funds"] })
      queryClient.invalidateQueries({ queryKey: ["fund-options"] })
      queryClient.invalidateQueries({ queryKey: ["fund-report"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
    },
  })
}