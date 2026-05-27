import { useQuery } from "@tanstack/react-query"
import { getTransactionAttachments } from "../attachment-api"

export function useTransactionAttachments(transactionId: string, enabled = true) {
  return useQuery({
    queryKey: ["transaction-attachments", transactionId],
    queryFn: () => getTransactionAttachments(transactionId),
    enabled: enabled && Boolean(transactionId),
  })
}