import { httpClient } from "@/api/http-client"
import type { PageResponse } from "@/types/page-response"

import type {
  CreatePlatformOrganizationRequest,
  CreatePlatformOrganizationResponse,
  GetPlatformOrganizationsParams,
  PlatformOrganization,
} from "./platform-organization-types"

export async function getPlatformOrganizations(
  params: GetPlatformOrganizationsParams,
) {
  const response = await httpClient.get<
    PageResponse<PlatformOrganization>
  >(
    "/api/v1/platform/organizations",
    {
      params: {
        page: params.page,
        size: params.size,

        query:
          params.query?.trim() ||
          undefined,
      },
    },
  )

  return response.data
}

export async function createPlatformOrganization(
  data: CreatePlatformOrganizationRequest,
) {
  const response = await httpClient.post<
    CreatePlatformOrganizationResponse
  >(
    "/api/v1/platform/organizations",
    data,
  )

  return response.data
}