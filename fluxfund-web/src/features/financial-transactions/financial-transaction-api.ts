import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"
import type { ClassifyFinancialTransactionRequest, CreateFinancialTransactionRequest, CreateTransactionAllocationRequest, FinancialTransaction, ImportOfxResponse, TransactionAllocation, UpdateFinancialTransactionRequest, UpdateTransactionAllocationRequest } from "./financial-transaction-types"

type GetFinancialTransactionsParams = {
  page?: number
  size?: number
  type?: string
  status?: string
  accountId?: string
  categoryId?: string
  fundId?: string
  description?: string
  settlementDateFrom?: string
  settlementDateTo?: string
  source?: string
  onlyUnclassified?: boolean
  onlyUnallocated?: boolean
  sort?: string
}

export async function getFinancialTransactions({
  page = 0,
  size = 10,
  type,
  status,
  accountId,
  categoryId,
  fundId,
  description,
  settlementDateFrom,
  settlementDateTo,
  source,
  onlyUnclassified,
  onlyUnallocated,
  sort
}: GetFinancialTransactionsParams = {}) {
  const response = await httpClient.get<PageResponse<FinancialTransaction>>(
    "/api/v1/financial-transactions",
    {
      params: {
        page,
        size,
        type: type || undefined,
        status: status || undefined,
        source: source || undefined,
        accountId: accountId || undefined,
        categoryId: categoryId || undefined,
        fundId: fundId || undefined,
        description: description || undefined,
        settlementDateFrom: settlementDateFrom || undefined,
        settlementDateTo: settlementDateTo || undefined,
        onlyUnclassified: onlyUnclassified || undefined,
        onlyUnallocated: onlyUnallocated || undefined,
        sort: sort || undefined,
      },
    },
  )

  return response.data
}

export async function getFinancialTransactionById(id: string) {
  const response = await httpClient.get<FinancialTransaction>(
    `/api/v1/financial-transactions/${id}`,
  )

  return response.data
}

export async function createFinancialTransaction(
  data: CreateFinancialTransactionRequest,
) {
  const response = await httpClient.post<FinancialTransaction>(
    "/api/v1/financial-transactions", data)

  return response.data
}

export async function updateFinancialTransaction(
  id: string,
  data: UpdateFinancialTransactionRequest,
) {
  const response = await httpClient.put<FinancialTransaction>(
    `/api/v1/financial-transactions/${id}`,
    data)

  return response.data
}

export async function cancelFinancialTransaction(id: string) {
  await httpClient.delete(`/api/v1/financial-transactions/${id}`)
}

export async function addTransactionAllocation(
  transactionId: string,
  data: CreateTransactionAllocationRequest,
) {
  const response = await httpClient.post<TransactionAllocation>(
    `/api/v1/financial-transactions/${transactionId}/allocations`, data)

  return response.data
}

export async function updateTransactionAllocation(
  transactionId: string,
  allocationId: string,
  data: UpdateTransactionAllocationRequest,
) {
  const response = await httpClient.put<TransactionAllocation>(
    `/api/v1/financial-transactions/${transactionId}/allocations/${allocationId}`,
    data)

  return response.data
}

export async function deleteTransactionAllocation(
  transactionId: string,
  allocationId: string,
) {
  await httpClient.delete(
    `/api/v1/financial-transactions/${transactionId}/allocations/${allocationId}`)
}

export async function importOfxFile({
  accountId,
  file,
}: {
  accountId: string
  file: File
}) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await httpClient.post<ImportOfxResponse>(
    "/api/v1/financial-transactions/import/ofx",
    formData,
    {
      params: {
        accountId,
      },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  )

  return response.data
}

export async function classifyFinancialTransaction({
  transactionId,
  data,
}: {
  transactionId: string
  data: ClassifyFinancialTransactionRequest
}) {
  const response = await httpClient.put<FinancialTransaction>(
    `/api/v1/financial-transactions/${transactionId}/classify`, data)

  return response.data
}

export type ExportSettledFinancialTransactionsParams = {
  startDate?: string
  endDate?: string
}

export async function exportSettledFinancialTransactionsExcel({
  startDate,
  endDate,
}: ExportSettledFinancialTransactionsParams) {
  const response = await httpClient.get<Blob>(
    "/api/v1/financial-transactions/export/settled.xlsx",
    {
      params: {
        startDate,
        endDate,
      },
      responseType: "blob",
    },
  )

  return response.data
}