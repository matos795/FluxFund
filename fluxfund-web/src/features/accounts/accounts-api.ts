import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"
import type {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
} from "@/features/accounts/types"
import type { OptionResponse } from "@/types/option-response"

type GetAccountsParams = {
  page?: number
  size?: number
}

export async function getAccounts({
  page = 0,
  size = 10,
}: GetAccountsParams = {}) {
  const response = await httpClient.get<PageResponse<Account>>("/api/v1/accounts",
    {
      params: {
        page,
        size,
      },
    },
  )

  return response.data
}

export async function createAccount(data: CreateAccountRequest) {
  const response = await httpClient.post<Account>("/api/v1/accounts", data)

  return response.data
}

export async function updateAccount(data: UpdateAccountRequest) {
  const { id, ...body } = data

  const response = await httpClient.put<Account>(`/api/v1/accounts/${id}`, body)

  return response.data
}

export async function deleteAccount(id: string) {
  await httpClient.delete(`/api/v1/accounts/${id}`)
}

export async function getAccountOptions() {
  const response = await httpClient.get<OptionResponse[]>(
    "/api/v1/accounts/options",
  )

  return response.data
}