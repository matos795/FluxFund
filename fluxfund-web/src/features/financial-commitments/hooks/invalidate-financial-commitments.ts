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
                "support-agreements",
            ],
        }),

        queryClient.invalidateQueries({
            queryKey: [
                "support-agreement-suggestions",
            ],
        }),
    ])
}