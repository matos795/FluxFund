import {
  httpClient,
} from "@/api/http-client"

import type {
  PageResponse,
} from "@/types/page-response"

import type {
  CreateReceiptDraftRequest,
  GetReceiptsParams,
  Receipt,
} from "./receipt-types"

export async function getReceipts({
  page = 0,
  size = 10,
  status,
  receiptType,
}: GetReceiptsParams) {
  const response =
    await httpClient.get<
      PageResponse<Receipt>
    >(
      "/api/v1/receipts",
      {
        params: {
          page,
          size,

          status:
            status ||
            undefined,

          receiptType:
            receiptType ||
            undefined,

          sort:
            "createdAt,desc",
        },
      },
    )

  return response.data
}

export async function createReceiptDraft(
  data:
    CreateReceiptDraftRequest,
) {
  const response =
    await httpClient.post<
      Receipt
    >(
      "/api/v1/receipts",
      data,
    )

  return response.data
}

export async function updateReceiptDraft({
  receiptId,
  data,
}: {
  receiptId: string

  data:
    CreateReceiptDraftRequest
}) {
  const response =
    await httpClient.put<
      Receipt
    >(
      `/api/v1/receipts/${receiptId}`,
      data,
    )

  return response.data
}

export async function deleteReceiptDraft(
  receiptId:
    string,
) {
  await httpClient.delete(
    `/api/v1/receipts/${receiptId}`,
  )
}

export async function issueReceipt(
  receiptId:
    string,
) {
  const response =
    await httpClient.post<
      Receipt
    >(
      `/api/v1/receipts/${receiptId}/issue`,
    )

  return response.data
}

export async function cancelReceipt({
  receiptId,
  reason,
}: {
  receiptId: string
  reason: string
}) {
  const response =
    await httpClient.patch<
      Receipt
    >(
      `/api/v1/receipts/${receiptId}/cancel`,

      {
        reason,
      },
    )

  return response.data
}

export async function reissueReceipt(
  receiptId:
    string,
) {
  const response =
    await httpClient.post<
      Receipt
    >(
      `/api/v1/receipts/${receiptId}/reissue`,
    )

  return response.data
}

export async function getReceiptPreviewPdf(
  receiptId:
    string,
) {
  const response =
    await httpClient.get<Blob>(
      `/api/v1/receipts/${receiptId}/preview.pdf`,

      {
        responseType:
          "blob",
      },
    )

  return response.data
}

export async function getReceiptPdf(
  receiptId:
    string,
) {
  const response =
    await httpClient.get<Blob>(
      `/api/v1/receipts/${receiptId}/file`,

      {
        responseType:
          "blob",
      },
    )

  return response.data
}