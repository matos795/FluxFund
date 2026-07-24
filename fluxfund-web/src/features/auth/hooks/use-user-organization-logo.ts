import { useQuery } from "@tanstack/react-query"

import { getUserOrganizationLogo } from "../user-organization-logo-api"

export function useUserOrganizationLogo(
  organizationId: string,
  hasLogo: boolean,
) {
  return useQuery({
    queryKey: [
      "user-organization-logo",
      organizationId,
    ],

    queryFn: () =>
      getUserOrganizationLogo(organizationId),

    enabled:
      Boolean(organizationId) &&
      hasLogo,

    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })
}