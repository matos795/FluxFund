import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UpdateFundRequest } from "../fund-types"
import { updateFund } from "../fund-api"


export function useUpdateFund() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateFundRequest) => updateFund(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["funds"] })
            queryClient.invalidateQueries({ queryKey: ["fund-options"] })
        }
    })
}