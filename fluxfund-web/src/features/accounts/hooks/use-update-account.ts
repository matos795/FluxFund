import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateAccountRequest } from "../types";
import { updateAccount } from "../accounts-api";


export function useUpdateAccount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateAccountRequest) => updateAccount(data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["accounts"],
            })
        },
    })
}