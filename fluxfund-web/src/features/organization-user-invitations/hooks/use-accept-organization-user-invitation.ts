import { useMutation } from "@tanstack/react-query"

import { acceptOrganizationUserInvitation } from "../organization-user-invitation-api"
import type { AcceptOrganizationUserInvitationRequest } from "../organization-user-invitation-types"

type AcceptInvitationVariables = {
  token: string
  data: AcceptOrganizationUserInvitationRequest
}

export function useAcceptOrganizationUserInvitation() {
  return useMutation({
    mutationFn: ({
      token,
      data,
    }: AcceptInvitationVariables) =>
      acceptOrganizationUserInvitation(
        token,
        data,
      ),
  })
}