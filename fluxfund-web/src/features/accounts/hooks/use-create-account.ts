import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createAccount } from "@/features/accounts/accounts-api"
import type { CreateAccountRequest } from "@/features/accounts/types"

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAccountRequest) => createAccount(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["accounts"],
      },)
      queryClient.invalidateQueries({ queryKey: ["account-options"] })
    },
  })
}