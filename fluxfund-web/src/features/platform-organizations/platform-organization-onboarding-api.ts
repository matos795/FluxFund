import { httpClient } from "@/api/http-client"

import type {
  PlatformOrganizationOnboardingDetails,
  UpdatePlatformOrganizationOnboardingRequest,
} from "./platform-organization-onboarding-types"

export async function getPlatformOrganizationOnboarding(
  organizationId: string,
) {
  const response =
    await httpClient.get<PlatformOrganizationOnboardingDetails>(
      `/api/v1/platform/organizations/${organizationId}/onboarding`,
    )

  return response.data
}

export async function updatePlatformOrganizationOnboarding(
  organizationId: string,
  data: UpdatePlatformOrganizationOnboardingRequest,
) {
  const response =
    await httpClient.put<PlatformOrganizationOnboardingDetails>(
      `/api/v1/platform/organizations/${organizationId}/onboarding`,
      data,
    )

  return response.data
}