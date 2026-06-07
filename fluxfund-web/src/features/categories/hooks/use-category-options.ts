import { useQuery } from "@tanstack/react-query"

import { getCategoryOptions } from "../category-api"
import type { CategoryType } from "../category-types"

export function useCategoryOptions(type?: CategoryType, enabled = true) {
  return useQuery({
    queryKey: ["category-options", type ?? "ALL"],
    queryFn: () => getCategoryOptions(type),
    enabled,
  })
}