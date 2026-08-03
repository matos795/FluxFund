import {
    useQuery,
} from "@tanstack/react-query"

import {
    getFinancialCommitmentReconciliation,
} from "../financial-commitment-api"

import type {
    GetFinancialCommitmentReconciliationParams,
} from "../financial-commitment-types"

export function useFinancialCommitmentReconciliation(
    params:
        GetFinancialCommitmentReconciliationParams,
) {
    return useQuery({
        queryKey: [
            "financial-commitment-reconciliation",
            params,
        ],

        queryFn: () =>
            getFinancialCommitmentReconciliation(
                params,
            ),
    })
}