import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"
import type { Account, CreateAccountRequest } from "@/features/accounts/types"

const TEMP_ORGANIZATION_ID = "053453dd-0a51-4650-b8aa-8f17776127eb"

type GetAccountsParams = {
  page?: number
  size?: number
}

export async function getAccounts({
  page = 0,
  size = 10,
}: GetAccountsParams = {}) {
  const response = await httpClient.get<PageResponse<Account>>(
    "/api/v1/accounts",
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

export async function createAccount(data: CreateAccountRequest) {
  const response = await httpClient.post<Account>("/api/v1/accounts", data, {
    params: {
      organizationId: TEMP_ORGANIZATION_ID,
    },
  })

  return response.data
}