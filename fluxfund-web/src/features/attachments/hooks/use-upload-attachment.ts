import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { invalidateFinancialData } from "@/features/financial-transactions/hooks/invalidate-financial-data"
import { uploadAttachment } from "../attachment-api"

export function useUploadAttachment(
  transactionId?: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadAttachment,

    onSuccess: (_attachment, variables) => {
      const resolvedTransactionId =
        transactionId ??
        variables.transactionId

      queryClient.invalidateQueries({
        queryKey: [
          "transaction-attachments",
          resolvedTransactionId,
        ],
      })

      invalidateFinancialData(queryClient)
    },
  })
}