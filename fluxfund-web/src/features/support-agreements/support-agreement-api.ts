import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"
import type {
  CreateSupportAgreementRequest,
  SupportAgreement,
  UpdateSupportAgreementRequest,
} from "./support-agreement-types"

const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

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
    organizationId: TEMP_ORGANIZATION_ID,
    page,
    size,
  }

  if (active !== undefined) {
    params.active = active
  }

  const response = await httpClient.get<PageResponse<SupportAgreement>>(
    "/api/v1/support-agreements",
    {
      params,
    },
  )

  return response.data
}

export async function createSupportAgreement(
  data: Omit<CreateSupportAgreementRequest, "organizationId">,
) {
  const response = await httpClient.post<SupportAgreement>(
    "/api/v1/support-agreements",
    {
      ...data,
      organizationId: TEMP_ORGANIZATION_ID,
    },
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
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
      },
    },
  )

  return response.data
}

export async function deleteSupportAgreement(id: string) {
  await httpClient.delete(`/api/v1/support-agreements/${id}`, {
    params: {
      organizationId: TEMP_ORGANIZATION_ID,
    },
  })
}

export async function activateSupportAgreement(id: string) {
  const response = await httpClient.patch<SupportAgreement>(
    `/api/v1/support-agreements/${id}/activate`,
    null,
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
      },
    },
  )

  return response.data
}