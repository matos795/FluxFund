import { httpClient } from "@/api/http-client"
import type {
  OrganizationSettings,
  UpdateOrganizationSettingsRequest,
} from "./organization-settings-types"

const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

export async function getOrganizationSettings() {
  const response = await httpClient.get<OrganizationSettings>(
    "/api/v1/organization-settings",
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
      },
    },
  )

  return response.data
}

export async function updateOrganizationSettings(
  data: UpdateOrganizationSettingsRequest,
) {
  const response = await httpClient.put<OrganizationSettings>(
    "/api/v1/organization-settings",
    data,
    {
      params: {
        organizationId: TEMP_ORGANIZATION_ID,
      },
    },
  )

  return response.data
}