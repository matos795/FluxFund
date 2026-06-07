import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCategory } from "../category-api";

export function useDeleteCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            queryClient.invalidateQueries({ queryKey: ["category-options"] })
        },
    })
}