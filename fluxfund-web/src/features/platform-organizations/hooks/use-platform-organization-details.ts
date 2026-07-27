import { useQuery } from "@tanstack/react-query"

import { getPlatformOrganizationDetails } from "../platform-organization-api"

export function usePlatformOrganizationDetails(
  organizationId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      "platform-organization",
      organizationId,
    ],

    queryFn: () =>
      getPlatformOrganizationDetails(
        organizationId,
      ),

    enabled:
      enabled &&
      Boolean(organizationId),
  })
}