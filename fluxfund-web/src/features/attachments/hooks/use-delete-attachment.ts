import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteAttachment } from "../attachment-api"

export function useDeleteAttachment(transactionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transaction-attachments", transactionId],
      })
    },
  })
}