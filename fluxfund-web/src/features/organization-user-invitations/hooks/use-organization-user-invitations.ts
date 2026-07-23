import { useQuery } from "@tanstack/react-query"

import { getOrganizationUserInvitations } from "../organization-user-invitation-api"

export function useOrganizationUserInvitations() {
  return useQuery({
    queryKey: ["organization-user-invitations"],
    queryFn: getOrganizationUserInvitations,
  })
}