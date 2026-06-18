import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateFinancialData } from "@/features/financial-transactions/hooks/invalidate-financial-data"
import { deleteAttachment } from "../attachment-api"

export function useDeleteAttachment(transactionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transaction-attachments", transactionId],
      })

      invalidateFinancialData(queryClient)
    },
  })
}