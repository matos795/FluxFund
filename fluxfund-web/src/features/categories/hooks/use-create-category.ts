import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategory } from "../category-api";
import type { CreateCategoryRequest } from "../category-types";

export function useCreateCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateCategoryRequest) => createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            queryClient.invalidateQueries({ queryKey: ["category-options"] })
        },
    })
}