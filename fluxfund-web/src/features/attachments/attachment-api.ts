import { httpClient } from "@/api/http-client"
import type { Attachment, AttachmentType } from "./attachment-types"

export async function getTransactionAttachments(transactionId: string) {
  const response = await httpClient.get<Attachment[]>(
    `/api/v1/financial-transactions/${transactionId}/attachments`,
  )

  return response.data
}

export async function uploadAttachment({
  transactionId,
  type,
  file,
}: {
  transactionId: string
  type: AttachmentType
  file: File
}) {
  const formData = new FormData()
  formData.append("type", type)
  formData.append("file", file)

  const response = await httpClient.post<Attachment>(
    `/api/v1/financial-transactions/${transactionId}/attachments`,
    formData,
  )

  return response.data
}

export async function deleteAttachment(attachmentId: string) {
  await httpClient.delete(`/api/v1/attachments/${attachmentId}`)
}

export async function downloadAttachment(attachmentId: string) {
  const response = await httpClient.get<Blob>(
    `/api/v1/attachments/${attachmentId}/download`,
    {
      responseType: "blob",
    },
  )

  return response.data
}