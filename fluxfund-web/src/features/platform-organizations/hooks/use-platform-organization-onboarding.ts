import { useQuery } from "@tanstack/react-query"

import { getPlatformOrganizationOnboarding } from "../platform-organization-onboarding-api"

export function usePlatformOrganizationOnboarding(
  organizationId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      "platform-organization-onboarding",
      organizationId,
    ],

    queryFn: () =>
      getPlatformOrganizationOnboarding(
        organizationId,
      ),

    enabled:
      enabled &&
      Boolean(organizationId),
  })
}