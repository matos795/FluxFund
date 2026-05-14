import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteAccount } from "@/features/accounts/accounts-api"

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["accounts"],
      })
    },
  })
}