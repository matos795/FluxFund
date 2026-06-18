import { useQuery } from "@tanstack/react-query"

import { getCategoryTree } from "../category-api"
import type { CategoryType } from "../category-types"

type UseCategoryTreeParams = {
  type?: CategoryType
  includeInactive?: boolean
}

export function useCategoryTree({
  type,
  includeInactive = false,
}: UseCategoryTreeParams = {}) {
  return useQuery({
    queryKey: ["category-tree", { type: type ?? "ALL", includeInactive }],
    queryFn: () =>
      getCategoryTree({
        type,
        includeInactive,
      }),
  })
}