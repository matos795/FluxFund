import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateBeneficiaryRequest } from "../beneficiary-types"
import { createBeneficiary } from "../beneficiary-api"

export function useCreateBeneficiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBeneficiaryRequest) => createBeneficiary(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["beneficiaries"],
      })
      queryClient.invalidateQueries({ queryKey: ["beneficiary-options"] })
    },
  })
}