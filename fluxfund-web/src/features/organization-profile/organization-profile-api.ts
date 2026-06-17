import { httpClient } from "@/api/http-client"

import type {
  OrganizationProfile,
  UpdateOrganizationProfileRequest,
} from "./organization-profile-types"

export async function getOrganizationProfile() {
  const response = await httpClient.get<OrganizationProfile>(
    "/api/v1/organization-profile",
  )

  return response.data
}

export async function updateOrganizationProfile(
  data: UpdateOrganizationProfileRequest,
) {
  const response = await httpClient.put<OrganizationProfile>(
    "/api/v1/organization-profile",
    data,
  )

  return response.data
}
