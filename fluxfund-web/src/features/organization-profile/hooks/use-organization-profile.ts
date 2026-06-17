import { useQuery } from "@tanstack/react-query"

import { getOrganizationProfile } from "../organization-profile-api"

export function useOrganizationProfile() {
  return useQuery({
    queryKey: ["organization-profile"],
    queryFn: getOrganizationProfile,
  })
}
