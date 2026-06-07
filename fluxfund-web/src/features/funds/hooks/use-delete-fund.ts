import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteFund } from "../fund-api"


export function useDeleteFund() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteFund(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["funds"] })
            queryClient.invalidateQueries({ queryKey: ["fund-options"] })
        },
    })
}