import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"
import type { FinancialTransaction } from "./financial-transaction-types"

const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

type GetFinancialTransactionsParams = {
  page?: number
  size?: number
}

export async function getFinancialTransactions({
  page = 0,
  size = 10,
}: GetFinancialTransactionsParams = {}) {
  const response = await httpClient.get<PageResponse<FinancialTransaction>>(
    "/api/v1/financial-transactions",
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
        page,
        size,
      },
    },
  )

  return response.data
}