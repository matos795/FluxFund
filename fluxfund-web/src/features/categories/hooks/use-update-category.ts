import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateFinancialData } from "@/features/financial-transactions/hooks/invalidate-financial-data"
import { updateCategory } from "../category-api"
import type { UpdateCategoryRequest } from "../category-types"

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateCategoryRequest) => updateCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["category-tree"] })
      queryClient.invalidateQueries({ queryKey: ["category-options"] })

      invalidateFinancialData(queryClient)
    },
  })
}