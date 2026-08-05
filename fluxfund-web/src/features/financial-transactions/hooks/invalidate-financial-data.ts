import type {
  QueryClient,
} from "@tanstack/react-query"

export async function invalidateFinancialData(
  queryClient: QueryClient,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey:
        ["financial-transactions"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["financial-transaction"],
    }),

    queryClient.invalidateQueries({
      queryKey: [
        "financial-commitment-allocation-suggestions",
      ],
    }),

    queryClient.invalidateQueries({
      queryKey: [
        "financial-commitments",
      ],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["dashboard-summary"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["dashboard-alerts"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["dashboard-action-items"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["dashboard-monthly-cash-flow"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["dashboard-expenses-by-category"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["dashboard-funds-overview"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["funds"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["fund-report"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["category-result-report"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["accountability-report"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["accountability-by-account-report"],
    }),

    queryClient.invalidateQueries({
      queryKey:
        ["credit-card-statement-items"],
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
        "receipts",
      ],
    }),

    queryClient.invalidateQueries({
      queryKey: [
        "financial-parties-360",
      ],
    }),
  ])
}