import { useMutation, useQueryClient } from "@tanstack/react-query"
import { uploadAttachment } from "../attachment-api"

export function useUploadAttachment(transactionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transaction-attachments", transactionId],
      })
    },
  })
}