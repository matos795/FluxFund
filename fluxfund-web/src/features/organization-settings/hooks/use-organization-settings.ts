import { useQuery } from "@tanstack/react-query"

import { getOrganizationSettings } from "../organization-settings-api"

export function useOrganizationSettings() {
  return useQuery({
    queryKey: ["organization-settings"],
    queryFn: getOrganizationSettings,
  })
}