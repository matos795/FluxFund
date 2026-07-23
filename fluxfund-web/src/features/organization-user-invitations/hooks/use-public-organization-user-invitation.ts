import { useQuery } from "@tanstack/react-query"

import { getPublicOrganizationUserInvitation } from "../organization-user-invitation-api"

export function usePublicOrganizationUserInvitation(
  token: string,
) {
  return useQuery({
    queryKey: [
      "public-organization-user-invitation",
      token,
    ],
    queryFn: () =>
      getPublicOrganizationUserInvitation(token),
    enabled: Boolean(token),
    retry: false,
  })
}