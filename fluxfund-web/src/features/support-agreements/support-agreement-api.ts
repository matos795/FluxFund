import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"
import type {
  CreateSupportAgreementRequest,
  SupportAgreement,
  UpdateSupportAgreementRequest,
} from "./support-agreement-types"

export type GetSupportAgreementsParams = {
  page?: number
  size?: number
  active?: boolean
}

export async function getSupportAgreements({
  page = 0,
  size = 10,
  active,
}: GetSupportAgreementsParams) {
  const params: Record<string, string | number | boolean> = {
    page,
    size,
  }

  if (active !== undefined) {
    params.active = active
  }

  const response = await httpClient.get<PageResponse<SupportAgreement>>(
    "/api/v1/support-agreements",
    { params },
  )

  return response.data
}

export async function createSupportAgreement(
  data: CreateSupportAgreementRequest,
) {
  const response = await httpClient.post<SupportAgreement>(
    "/api/v1/support-agreements",
    data,
  )

  return response.data
}

export async function updateSupportAgreement({
  id,
  data,
}: {
  id: string
  data: UpdateSupportAgreementRequest
}) {
  const response = await httpClient.put<SupportAgreement>(
    `/api/v1/support-agreements/${id}`,
    data,
  )

  return response.data
}

export async function deleteSupportAgreement(id: string) {
  await httpClient.delete(`/api/v1/support-agreements/${id}`)
}

export async function activateSupportAgreement(id: string) {
  const response = await httpClient.patch<SupportAgreement>(
    `/api/v1/support-agreements/${id}/activate`,
  )

  return response.data
}