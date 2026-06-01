import { httpClient } from "@/api/http-client"
import type {
  OrganizationSettings,
  UpdateOrganizationSettingsRequest,
} from "./organization-settings-types"

export async function getOrganizationSettings() {
  const response = await httpClient.get<OrganizationSettings>(
    "/api/v1/organization-settings")

  return response.data
}

export async function updateOrganizationSettings(
  data: UpdateOrganizationSettingsRequest,
) {
  const response = await httpClient.put<OrganizationSettings>(
    "/api/v1/organization-settings", data)

  return response.data
}