import { useQuery } from "@tanstack/react-query"

import { getOrganizationUsers } from "../organization-user-api"

export function useOrganizationUsers() {
  return useQuery({
    queryKey: ["organization-users"],
    queryFn: getOrganizationUsers,
  })
}