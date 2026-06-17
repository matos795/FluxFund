import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createFundTransfer } from "../fund-api"
import type { CreateFundTransferRequest } from "../fund-types"

export function useCreateFundTransfer() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateFundTransferRequest) =>
            createFundTransfer(data),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fund-transfers"] })
            queryClient.invalidateQueries({ queryKey: ["funds"] })
            queryClient.invalidateQueries({ queryKey: ["fund-options"] })
            queryClient.invalidateQueries({ queryKey: ["fund-report"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
        },
    })
}