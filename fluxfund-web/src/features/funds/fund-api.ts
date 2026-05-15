import type { PageResponse } from "@/types/page-response"
import { httpClient } from "@/api/http-client"
import type { CreateFundRequest, Fund, UpdateFundRequest } from "./fund-types"


const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

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
                organizationId: TEMP_ORGANIZATION_ID,
                page,
                size,
            }
        }
    )
    return response.data
}

export async function createFund(data: CreateFundRequest) {
    const response = await httpClient.post<Fund>("/api/v1/funds", data, {
        params: {
            organizationId: TEMP_ORGANIZATION_ID,
        },
    })
    return response.data
}

export async function updateFund(data: UpdateFundRequest) {
    const { id, ...body } = data
    const response = await httpClient.put<Fund>(`/api/v1/funds/${id}`, body, {
        params: {
            organizationId: TEMP_ORGANIZATION_ID,
        },
    })
    return response.data
}

export async function deleteFund(id: string) {
    await httpClient.delete(`/api/v1/funds/${id}`, {
        params: {
            organizationId: TEMP_ORGANIZATION_ID,
        },
    })
}