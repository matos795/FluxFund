import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteBeneficiary } from "../beneficiary-api"

export function useDeleteBeneficiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBeneficiary(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["beneficiaries"],
      })
      queryClient.invalidateQueries({ queryKey: ["beneficiary-options"] })
    },
  })
}