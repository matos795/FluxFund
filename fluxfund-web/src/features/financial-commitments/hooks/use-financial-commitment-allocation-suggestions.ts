import {
    useQuery,
} from "@tanstack/react-query"

import {
    getFinancialCommitmentAllocationSuggestions,
} from "../financial-commitment-api"

type Params = {
    transactionType:
    "INCOME" | "EXPENSE"

    sourcePartyId?:
    string | null

    recipientPartyId?:
    string | null

    fundId: string
    referenceMonth: string
    availableAmount: number

    excludedAllocationId?:
    string | null
}

export function useFinancialCommitmentAllocationSuggestions({
    params,
    enabled,
}: {
    params: Params
    enabled: boolean
}) {
    return useQuery({
        queryKey: [
            "financial-commitment-allocation-suggestions",
            params,
        ],

        queryFn: () =>
            getFinancialCommitmentAllocationSuggestions(
                params,
            ),

        enabled,

        staleTime:
            30_000,

        retry: false,

        refetchOnWindowFocus:
            false,
    })
}