import type { QueryClient } from "@tanstack/react-query"

export function invalidateFinancialData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["financial-transactions"] })
  queryClient.invalidateQueries({ queryKey: ["financial-transaction"] })

  queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
  queryClient.invalidateQueries({ queryKey: ["dashboard-alerts"] })
  queryClient.invalidateQueries({ queryKey: ["dashboard-action-items"] })
  queryClient.invalidateQueries({ queryKey: ["dashboard-monthly-cash-flow"] })
  queryClient.invalidateQueries({ queryKey: ["dashboard-expenses-by-category"] })
  queryClient.invalidateQueries({ queryKey: ["dashboard-funds-overview"] })

  queryClient.invalidateQueries({ queryKey: ["funds"] })
  queryClient.invalidateQueries({ queryKey: ["fund-report"] })
  queryClient.invalidateQueries({ queryKey: ["category-result-report"] })
  queryClient.invalidateQueries({ queryKey: ["accountability-report"] })
  queryClient.invalidateQueries({ queryKey: ["accountability-by-account-report"] })
  queryClient.invalidateQueries({ queryKey: ["credit-card-statement-items"] })
}