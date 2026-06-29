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

export async function uploadOrganizationLogo(file: File) {
  const formData = new FormData()

  formData.append("file", file)

  const response = await httpClient.post<OrganizationProfile>(
    "/api/v1/organization-profile/logo",
    formData,
  )

  return response.data
}

export async function downloadOrganizationLogo() {
  const response = await httpClient.get<Blob>(
    "/api/v1/organization-profile/logo",
    {
      responseType: "blob",
    },
  )

  return response.data
}

export async function deleteOrganizationLogo() {
  await httpClient.delete("/api/v1/organization-profile/logo")
}