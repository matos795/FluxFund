import type { PageResponse } from "@/types/page-response"
import { httpClient } from "@/api/http-client"
import type { CreateFundRequest, CreateFundTransferRequest, Fund, FundOption, FundTransfer, UpdateFundRequest } from "./fund-types"

type GetFundsParams = {
    page?: number
    size?: number
}

export async function getFunds({
    page = 0,
    size = 10,
}: GetFundsParams = {}) {
    const response = await httpClient.get<PageResponse<Fund>>("/api/v1/funds",
        {
            params: {
                page,
                size,
            }
        }
    )
    return response.data
}

export async function createFund(data: CreateFundRequest) {
    const response = await httpClient.post<Fund>("/api/v1/funds", data)
    return response.data
}

export async function updateFund(data: UpdateFundRequest) {
    const { id, ...body } = data
    const response = await httpClient.put<Fund>(`/api/v1/funds/${id}`, body)
    return response.data
}

export async function deleteFund(id: string) {
    await httpClient.delete(`/api/v1/funds/${id}`)
}

export async function getFundOptions() {
  const response = await httpClient.get<FundOption[]>(
    "/api/v1/funds/options",
  )

  return response.data
}

export async function createFundTransfer(data: CreateFundTransferRequest) {
  const response = await httpClient.post<FundTransfer>(
    "/api/v1/fund-transfers",
    data,
  )

  return response.data
}

export async function cancelFundTransfer(id: string) {
  await httpClient.delete(`/api/v1/fund-transfers/${id}`)
}