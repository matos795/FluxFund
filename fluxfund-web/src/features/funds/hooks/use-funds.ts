import { useQuery } from "@tanstack/react-query"
import { getFunds } from "../fund-api"


type UseFundsParams = {
    page: number
    size: number
}

export function useFunds({ page, size }: UseFundsParams) {
    return useQuery({
        queryKey: ["funds", { page, size }],
        queryFn: () =>
            getFunds({
                page,
                size,
            }),
    })
}