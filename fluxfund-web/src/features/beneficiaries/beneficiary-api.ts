import { httpClient } from "@/api/http-client"
import type { Beneficiary, CreateBeneficiaryRequest, UpdateBeneficiaryRequest } from "./beneficiary-types"
import type { PageResponse } from "@/types/page-response"

const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

type GetBeneficiariesParams = {
  page?: number
  size?: number
}

export async function getBeneficiaries({
  page = 0,
  size = 10,
}: GetBeneficiariesParams = {}) {
  const response = await httpClient.get<PageResponse<Beneficiary>>("/api/v1/beneficiaries",
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

export async function createBeneficiary(data: CreateBeneficiaryRequest) {
  const response = await httpClient.post<Beneficiary>("/api/v1/beneficiaries", data, {
    params: {
      organizationId: TEMP_ORGANIZATION_ID,
    },
  })

  return response.data
}

export async function updateBeneficiary(data: UpdateBeneficiaryRequest) {
  const { id, ...body } = data

  const response = await httpClient.put<Beneficiary>(`/api/v1/beneficiaries/${id}`, body,
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
      },
    },
  )

  return response.data
}

export async function deleteBeneficiary(id: string) {
  await httpClient.delete(`/api/v1/beneficiaries/${id}`, {
    params: {
      organizationId: TEMP_ORGANIZATION_ID,
    },
  })
}