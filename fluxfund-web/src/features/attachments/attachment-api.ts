import { httpClient } from "@/api/http-client"
import type { Attachment, AttachmentType } from "./attachment-types"

const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

export async function getTransactionAttachments(transactionId: string) {
    const response = await httpClient.get<Attachment[]>(
        `/api/v1/financial-transactions/${transactionId}/attachments`,
        {
            params: {
                organizationId: TEMP_ORGANIZATION_ID,
            },
        },
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
        {
            params: {
                organizationId: TEMP_ORGANIZATION_ID,
            },
        },
    )

    return response.data
}

export async function deleteAttachment(attachmentId: string) {
    await httpClient.delete(`/api/v1/attachments/${attachmentId}`, {
        params: {
            organizationId: TEMP_ORGANIZATION_ID,
        },
    })
}

export function getAttachmentDownloadUrl(attachmentId: string) {
    const params = new URLSearchParams({
        organizationId: TEMP_ORGANIZATION_ID,
    })

    return `${API_BASE_URL}/api/v1/attachments/${attachmentId}/download?${params.toString()}`
}