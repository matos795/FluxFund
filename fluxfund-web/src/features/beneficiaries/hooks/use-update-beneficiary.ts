import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UpdateBeneficiaryRequest } from "../beneficiary-types"
import { updateBeneficiary } from "../beneficiary-api"

export function useUpdateBeneficiary() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateBeneficiaryRequest) => updateBeneficiary(data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["beneficiaries"],
            })
            queryClient.invalidateQueries({ queryKey: ["beneficiary-options"] })
        },
    })
}