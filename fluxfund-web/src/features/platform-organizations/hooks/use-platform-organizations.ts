import { useQuery } from "@tanstack/react-query"

import { getPlatformOrganizations } from "../platform-organization-api"
import type { GetPlatformOrganizationsParams } from "../platform-organization-types"

export function usePlatformOrganizations(
  params: GetPlatformOrganizationsParams,
) {
  return useQuery({
    queryKey: [
      "platform-organizations",
      params.page,
      params.size,
      params.query ?? "",
    ],

    queryFn: () =>
      getPlatformOrganizations(params),
  })
}