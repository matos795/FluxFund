import { httpClient } from "@/api/http-client"
import type { Beneficiary, CreateBeneficiaryRequest, UpdateBeneficiaryRequest } from "./beneficiary-types"
import type { PageResponse } from "@/types/page-response"
import type { OptionResponse } from "@/types/option-response"

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
        page,
        size,
      },
    },
  )

  return response.data
}

export async function createBeneficiary(data: CreateBeneficiaryRequest) {
  const response = await httpClient.post<Beneficiary>("/api/v1/beneficiaries", data)

  return response.data
}

export async function updateBeneficiary(data: UpdateBeneficiaryRequest) {
  const { id, ...body } = data

  const response = await httpClient.put<Beneficiary>(`/api/v1/beneficiaries/${id}`, body)

  return response.data
}

export async function deleteBeneficiary(id: string) {
  await httpClient.delete(`/api/v1/beneficiaries/${id}`)
}

export async function getBeneficiaryOptions() {
  const response = await httpClient.get<OptionResponse[]>(
    "/api/v1/beneficiaries/options",
  )

  return response.data
}