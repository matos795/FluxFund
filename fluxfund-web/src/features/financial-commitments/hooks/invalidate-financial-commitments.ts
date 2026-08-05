import type {
    QueryClient,
} from "@tanstack/react-query"

export async function invalidateFinancialCommitments(
    queryClient:
        QueryClient,
) {
    await Promise.all([
        queryClient.invalidateQueries({
            queryKey: [
                "financial-commitments",
            ],
        }),

        queryClient.invalidateQueries({
            queryKey: [
                "financial-commitment-allocation-suggestions",
            ],
        }),

        queryClient.invalidateQueries({
            queryKey: [
                "financial-commitment-reconciliation",
            ],
        }),

        queryClient.invalidateQueries({
            queryKey: [
                "financial-commitment-monthly-report",
            ],
        }),

        queryClient.invalidateQueries({
            queryKey: [
                "financial-forecast-report",
            ],
        }),

        queryClient.invalidateQueries({
            queryKey: [
                "financial-parties-360",
            ],
        }),
    ])
}