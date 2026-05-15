import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateFundRequest } from "../fund-types"
import { createFund } from "../fund-api"


export function useCreateFund() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateFundRequest) => createFund(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["funds"] })
        },
    })
}