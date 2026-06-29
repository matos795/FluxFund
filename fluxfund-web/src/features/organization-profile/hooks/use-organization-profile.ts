import { useQuery } from "@tanstack/react-query"

import { getOrganizationProfile } from "../organization-profile-api"

export const organizationProfileQueryKey = [
  "organization-profile",
] as const

export function useOrganizationProfile() {
  return useQuery({
    queryKey: organizationProfileQueryKey,
    queryFn: getOrganizationProfile,
  })
}