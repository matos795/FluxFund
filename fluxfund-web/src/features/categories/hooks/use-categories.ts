import { useQuery } from "@tanstack/react-query"
import { getCategories } from "../category-api"


type UseCategoriesParams = {
    page: number
    size: number
}

export function useCategories({ page, size }: UseCategoriesParams) {
    return useQuery({
        queryKey: ["categories", { page, size }],
        queryFn: () =>
            getCategories({
                page,
                size,
            }),
    })
}