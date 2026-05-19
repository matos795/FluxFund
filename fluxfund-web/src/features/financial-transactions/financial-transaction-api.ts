import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"
import type { CreateFinancialTransactionRequest, CreateTransactionAllocationRequest, FinancialTransaction, TransactionAllocation, UpdateFinancialTransactionRequest, UpdateTransactionAllocationRequest } from "./financial-transaction-types"

const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

type GetFinancialTransactionsParams = {
  page?: number
  size?: number
  type?: string
  status?: string
  accountId?: string
  categoryId?: string
  description?: string
  settlementDateFrom?: string
  settlementDateTo?: string
  source?: string
  onlyUnclassified?: boolean
  onlyUnallocated?: boolean
}

export async function getFinancialTransactions({
  page = 0,
  size = 10,
  type,
  status,
  accountId,
  categoryId,
  description,
  settlementDateFrom,
  settlementDateTo,
  source,
  onlyUnclassified,
  onlyUnallocated
}: GetFinancialTransactionsParams = {}) {
  const response = await httpClient.get<PageResponse<FinancialTransaction>>(
    "/api/v1/financial-transactions",
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
        page,
        size,
        type: type || undefined,
        status: status || undefined,
        source: source || undefined,
        accountId: accountId || undefined,
        categoryId: categoryId || undefined,
        description: description || undefined,
        settlementDateFrom: settlementDateFrom || undefined,
        settlementDateTo: settlementDateTo || undefined,
        onlyUnclassified: onlyUnclassified || undefined,
        onlyUnallocated: onlyUnallocated || undefined,
      },
    },
  )

  return response.data
}

export async function createFinancialTransaction(
  data: CreateFinancialTransactionRequest,
) {
  const response = await httpClient.post<FinancialTransaction>(
    "/api/v1/financial-transactions",
    data,
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
      },
    },
  )

  return response.data
}

export async function updateFinancialTransaction(
  id: string,
  data: UpdateFinancialTransactionRequest,
) {
  const response = await httpClient.put<FinancialTransaction>(
    `/api/v1/financial-transactions/${id}`,
    data,
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
      },
    },
  )

  return response.data
}

export async function cancelFinancialTransaction(id: string) {
  await httpClient.delete(`/api/v1/financial-transactions/${id}`, {
    params: {
      organizationId: TEMP_ORGANIZATION_ID,
    },
  })
}

export async function addTransactionAllocation(
  transactionId: string,
  data: CreateTransactionAllocationRequest,
) {
  const response = await httpClient.post<TransactionAllocation>(
    `/api/v1/financial-transactions/${transactionId}/allocations`,
    data,
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
      },
    },
  )

  return response.data
}

export async function updateTransactionAllocation(
  transactionId: string,
  allocationId: string,
  data: UpdateTransactionAllocationRequest,
) {
  const response = await httpClient.put<TransactionAllocation>(
    `/api/v1/financial-transactions/${transactionId}/allocations/${allocationId}`,
    data,
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
      },
    },
  )

  return response.data
}

export async function deleteTransactionAllocation(
  transactionId: string,
  allocationId: string,
) {
  await httpClient.delete(
    `/api/v1/financial-transactions/${transactionId}/allocations/${allocationId}`,
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
      },
    },
  )
}